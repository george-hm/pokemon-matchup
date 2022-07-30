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

async function buildType(type: string, primaryType: boolean): Promise<Type> {
    console.log(`${BASE_URL}type/${type}`);
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
    return typeData;
}

export async function getPokemonByName(name: string): Promise<Pokemon> {
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

    return pokemon;
}

export function getPokemonMoves(): void {
    throw new Error('Method not implemented.');
}
