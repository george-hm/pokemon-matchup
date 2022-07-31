import axios from 'axios';
import { buildType, Type } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export default class Pokemon {
    static cachedPokemon: { [key: string]: Pokemon; } = {};

    name: string;

    types?: Type[];

    id: number;

    imageUrl: string;

    isFullyLoaded = false;

    constructor(name: string, id: number, imageUrl: string) {
        this.name = name;
        this.id = id;
        this.imageUrl = imageUrl;
    }

    static async getAllPokemon(): Promise<{ [key: string]: Pokemon; }> {
        const response = await axios(`${BASE_URL}pokemon?limit=10000`);
        const data = response?.data;
        if (!data) {
            throw new Error('No data');
        }

        const pokemon: {[key: string]: Pokemon} = {};
        data.results.forEach((result: { name: string; url: string; }) => {
            if (this.cachedPokemon[result.name]) {
                return;
            }

            const id = parseInt(
                result.url.split('pokemon/').pop() as string,
                10,
            );
            const createdPokemon = new Pokemon(
                result.name,
                id,
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            );

            pokemon[createdPokemon.name] = createdPokemon;
        });

        this.cachedPokemon = { ...this.cachedPokemon, ...pokemon };

        return this.cachedPokemon;
    }

    static async getPokemonByName(name: string): Promise<Pokemon> {
        // load pokemon first if we don't have any
        if (!Object.keys(this.cachedPokemon).length) {
            await this.getAllPokemon();
        }
        const foundPokemon: Pokemon = this.cachedPokemon[name];

        // if it's not in the cache it doesn't exist
        if (!foundPokemon.isFullyLoaded) {
            await foundPokemon.load();
        }

        return foundPokemon;
    }

    async load(): Promise<void> {
        const rawPokemonData = await axios(`${BASE_URL}pokemon/${this.name.toLowerCase()}`);

        const data = rawPokemonData?.data;
        const types: Type[] = await Promise.all(
            data.types.map(
                async (type: any) => buildType(
                    type.type.name,
                    type.slot === 1,
                ),
            ),
        );

        this.types = types;
        Pokemon.cachedPokemon[this.name] = this;

        this.isFullyLoaded = true;
    }
}
