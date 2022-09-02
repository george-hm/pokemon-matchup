import axios from 'axios';
import { SelectOption } from './component_interfaces';
import { convertGenStringToEnum, Generations, Versions } from './generations';
import { getTypeVersionsFromName, MinimalTypeInfo } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export interface Pokemon {
    name: string;
    typeVersions: Versions<MinimalTypeInfo[]>;
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

    const typeVersions: Versions<MinimalTypeInfo[]> = {
        [Generations.GEN_LATEST]: [],
    };

    let allTypeNames: string[] = [];
    for (let i = 0; i < data.types.length; i += 1) {
        const currentType = data.types[i];
        allTypeNames.push(currentType.type.name);
        typeVersions[Generations.GEN_LATEST].push({
            name: currentType.type.name,
            primary: currentType.slot === 1,
        });
    }

    if (data?.past_types) {
        for (let i = 0; i < data.past_types.length; i += 1) {
            const versionInfo = data.past_types[i];
            const version = convertGenStringToEnum(versionInfo.generation.url);
            if (!typeVersions[version]) {
                typeVersions[version] = [];
            }

            // now loop through the types
            for (let x = 0; x < versionInfo.types.length; x += 1) {
                const currentType = versionInfo.types[x];
                allTypeNames.push(currentType.type.name);
                typeVersions[version]?.push({
                    name: currentType.type.name,
                    primary: currentType.slot === 1,
                });
            }
        }
    }

    // dedupe all type names
    allTypeNames = [...new Set(allTypeNames)];
    // load all the types fully to put them into cache
    await Promise.all(allTypeNames.map(getTypeVersionsFromName));

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
