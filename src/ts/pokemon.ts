import axios from 'axios';
import { buildType, Type } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export interface Pokemon {
    name: string;
    types: Type[];
    id: number,
    imageUrl: string;
}

const cachedPokemon: { [key: string]: Pokemon; } = {};

export async function getPokemonByName(name: string): Promise<Pokemon> {
    // handle caching
    if (cachedPokemon[name]) {
        return cachedPokemon[name];
    }

    const response = await axios(`${BASE_URL}pokemon/${name.toLowerCase()}`);

    const data = response?.data;
    if (!data) {
        throw new Error('No data');
    }

    // map all types and await
    interface rawType {
        slot: number;
        type: {
            name: string;
        };
    }

    const types: Type[] = await Promise.all(
        data.types.map(
            async (type: rawType) => buildType(
                type.type.name,
                type.slot === 1,
            ),
        ),
    );
    const pokemon: Pokemon = {
        name: data.name,
        types,
        id: data.id,
        imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
    };

    cachedPokemon[name] = pokemon;

    return pokemon;
}

export async function getAllPokemonNames(): Promise<{ name: string; id: number}[]> {
    const response = await axios(`${BASE_URL}pokemon?limit=10000`);

    const data = response?.data;
    if (!data) {
        throw new Error('No data');
    }

    return data.results.map((result: { name: string; url: string; }) => ({
        name: result.name,
        id: parseInt(
            result.url.split('pokemon/').pop() as string,
            10,
        ),
    }));
}
