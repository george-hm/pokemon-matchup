import axios from 'axios';
import { buildType, Type } from './types';
import { SelectOption } from './component_interfaces';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export interface Pokemon {
    name: string;
    types: Type[];
    id: number;
}

const cachedPokemon: { [key: string]: Pokemon; } = {};

export async function getPokemonById(id: number): Promise<Pokemon> {
    // handle caching
    if (cachedPokemon[id]) {
        return cachedPokemon[id];
    }

    const response = await axios(`${BASE_URL}pokemon/${id}`);

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
    };

    cachedPokemon[id] = pokemon;

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
        value: parseInt(
            result.url.split('pokemon/').pop() as string,
            10,
        ),
    }));
}
