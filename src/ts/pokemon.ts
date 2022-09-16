import axios from 'axios';
import { SelectOption } from './component_interfaces';
import {
    convertGenStringToEnum, convertVersionGroupStringToEnum, Generations, Versions,
} from './generations';
import { getTypeVersionsFromName, MinimalTypeInfo } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export interface Pokemon {
    name: string;
    typeVersions: Versions<MinimalTypeInfo[]>;
    id: string;
    imageUrl: string;
    moves: Versions<{ [level: string]: string[] }>
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

    const moves: Versions<{ [level: string]: string[]; }> = {
        [Generations.GEN_LATEST]: {},
    };

    if (data?.moves) {
        for (let i = 0; i < data.moves.length; i += 1) {
            const moveData = data.moves[i];
            const moveName = moveData.move.name;
            const versionGroupInfo = moveData.version_group_details;
            for (let x = 0; x < versionGroupInfo.length; x += 1) {
                const currentVersionInfo = versionGroupInfo[x];
                const levelLearnedAt = currentVersionInfo.level_learned_at;
                // it kind of sucks we're doing an await in a loop here but
                // doing this another way is a huge pain
                // eslint-disable-next-line no-await-in-loop
                const gen = await convertVersionGroupStringToEnum(
                    currentVersionInfo.version_group.url,
                );
                moves[gen] = moves[gen] || {};
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                moves[gen]![levelLearnedAt] = moves[gen]![levelLearnedAt] || [];
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                moves[gen]![levelLearnedAt].push(moveName);
            }
        }

        // get the latest gen
        const latestGen = Object.keys(moves)
            .filter((gen) => !Number.isNaN(Number(gen)))
            .sort((a, b) => Number(b) - Number(a))[0];
        moves[Generations.GEN_LATEST] = moves[
            latestGen as Generations
        ] as { [level: string]: string[]; };
    }
    console.log('moves built');

    // dedupe all type names
    allTypeNames = [...new Set(allTypeNames)];
    // load all the types fully to put them into cache
    await Promise.all(allTypeNames.map(getTypeVersionsFromName));

    const pokemon: Pokemon = {
        name: data.name,
        typeVersions,
        id: data.id,
        imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
        moves,
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

export async function main() {
    const pokemon = await getPokemonById('blaziken');
    console.log(JSON.stringify(pokemon, null, 4));
}

main();
