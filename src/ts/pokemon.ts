import axios from 'axios';
import { SelectOption } from './component_interfaces';
import { buildFromRawTypes, Type, Versions } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export interface Pokemon {
    name: string;
    typeVersions: Versions<Type[]>;
    id: string;
    imageUrl: string;
}

const cachedPokemon: { [id: string]: Pokemon; } = {};

export async function getPokemonById(id: string|number): Promise<Pokemon> {
    const foundPokemon: Pokemon = cachedPokemon[id];
    if (foundPokemon) {
        return foundPokemon;
    }
    const rawPokemonData = await axios(`${BASE_URL}pokemon/${id}`);

    const data = rawPokemonData?.data;

    const typeVersions = await buildFromRawTypes(data);

    const pokemon: Pokemon = {
        name: data.name,
        typeVersions,
        id: data.id,
        imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
    };

    cachedPokemon[pokemon.name] = pokemon;

    return pokemon;
}

export async function getAllPokemonSelectOptions(): Promise<SelectOption[]> {
    const response = await axios(`${BASE_URL}pokemon?limit=10000`);
    const data = response?.data;
    if (!data) {
        throw new Error('No data');
    }

    return data.results.map((result: { name: string; url: string; }) => ({
        label: result.name,
        value: String(parseInt(
            result.url.split('pokemon/').pop() as string,
            10,
        )),
    }));
}
