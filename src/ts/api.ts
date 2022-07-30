import axios from 'axios';

const BASE_URL = 'https://pokeapi.co/api/v2/';

interface Type {
    name: string;
    primaryType: boolean;
    doubleDamageFrom: string[],
    doubleDamageTo: string[],
    halfDamageFrom: string[],
    halfDamageTo: string[],
    noDamageFrom: string[],
    noDamageTo: string[],
}

export interface Pokemon {
    name: string;
    types: Type[];
    id: number,
    imageUrl: string;
}

const cachedPokemon: { [key: string]: Pokemon; } = {};
const cachedTypes: { [key: string]: Type; } = {};

async function buildType(type: string, primaryType: boolean): Promise<Type> {
    // handle caching
    if (cachedTypes[type]) {
        return cachedTypes[type];
    }

    const response = await axios.get(`${BASE_URL}type/${type}`);
    const data = response?.data;
    if (!data) {
        throw new Error(`No type data for ${type}`);
    }

    const damageRelations: { [key: string]: { name: string }[]; } = data.damage_relations;
    const mapRelation = (rawType: { name: string }): string => rawType.name;
    const typeData: Type = {
        name: data.name,
        primaryType,
        doubleDamageFrom: damageRelations.double_damage_from.map(mapRelation),
        doubleDamageTo: damageRelations.double_damage_to.map(mapRelation),
        halfDamageFrom: damageRelations.half_damage_from.map(mapRelation),
        halfDamageTo: damageRelations.half_damage_to.map(mapRelation),
        noDamageFrom: damageRelations.no_damage_from.map(mapRelation),
        noDamageTo: damageRelations.no_damage_to.map(mapRelation),
    };

    cachedTypes[type] = typeData;

    return typeData;
}

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
        }
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

export async function getAllPokemonMoveNames(): Promise<string[]> {
    const response = await axios.get(`${BASE_URL}move?limit=10000`);
    const data = response?.data;
    if (!data) {
        throw new Error('No data');
    }

    return data.results.map((result: {name:string}) => result.name);
}

export async function getAllPokemonNames(): Promise<string[]> {
    const response = await axios(`${BASE_URL}pokemon?limit=10000`);

    const data = response?.data;
    if (!data) {
        throw new Error('No data');
    }

    return data.results.map((result: {name: string}) => result.name);
}
