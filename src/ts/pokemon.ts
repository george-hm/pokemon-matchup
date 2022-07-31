import axios from 'axios';
import { SelectOption } from './component_interfaces';
import { buildType, Type } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2/';

interface Pokemon {
    name: string;
    types: Type[];
    id: string;
    imageUrl: string;
}

const cachedPokemon: { [id: string]: Pokemon; } = {};

export async function getPokemonById(id: number): Promise<Pokemon> {
    const foundPokemon: Pokemon = cachedPokemon[id];
    if (foundPokemon) {
        return foundPokemon;
    }
    const rawPokemonData = await axios(`${BASE_URL}pokemon/${id}`);

    const data = rawPokemonData?.data;
    const types: Type[] = await Promise.all(
        data.types.map(
            async (type: { type: { name: string; }, slot: number; }) => buildType(
                type.type.name,
                type.slot === 1,
            ),
        ),
    );

    const pokemon: Pokemon = {
        name: data.name,
        id: String(data.id),
        imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
        types,
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
