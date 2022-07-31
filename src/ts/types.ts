import axios from 'axios';
import { Generations } from './generations';

const BASE_URL = 'https://pokeapi.co/api/v2/';

interface RawDamageRelation {
    // using Array<> here because its more readable
    [key: string]: Array<{ name: string; }>;
}

interface DamageMatchups {
    doubleDamageFrom: string[],
    doubleDamageTo: string[],
    halfDamageFrom: string[],
    halfDamageTo: string[],
    noDamageFrom: string[],
    noDamageTo: string[],
}

interface Versions {
    [Generations.GEN_LATEST]: DamageMatchups;
    [Generations.GEN_1]?: DamageMatchups;
    [Generations.GEN_2]?: DamageMatchups;
    [Generations.GEN_3]?: DamageMatchups;
    [Generations.GEN_4]?: DamageMatchups;
    [Generations.GEN_5]?: DamageMatchups;
    [Generations.GEN_6]?: DamageMatchups;
    [Generations.GEN_7]?: DamageMatchups;
    [Generations.GEN_8]?: DamageMatchups;
}
export interface Type {
    name: string;
    primaryType?: boolean;
    versions: Versions;
}

const cachedTypes: { [key: string]: Type; } = {};

function mapDamageRelations(raw: RawDamageRelation): DamageMatchups {
    const mapRelation = (rawType: { name: string; }): string => rawType.name;
    const relations = {
        doubleDamageFrom: raw.double_damage_from.map(mapRelation),
        doubleDamageTo: raw.double_damage_to.map(mapRelation),
        halfDamageFrom: raw.half_damage_from.map(mapRelation),
        halfDamageTo: raw.half_damage_to.map(mapRelation),
        noDamageFrom: raw.no_damage_from.map(mapRelation),
        noDamageTo: raw.no_damage_to.map(mapRelation),
    };

    return relations;
}

export async function buildType(type: string, primaryType: boolean): Promise<Type> {
    // handle caching
    if (cachedTypes[type]) {
        const cached = cachedTypes[type];
        cached.primaryType = primaryType;
        return cached;
    }

    const response = await axios.get(`${BASE_URL}type/${type}`);
    const data = response?.data;
    if (!data) {
        throw new Error(`No type data for ${type}`);
    }

    const typeData: Type = {
        name: data.name,
        primaryType,
        versions: {
            [Generations.GEN_LATEST]: mapDamageRelations(data.damage_relations),
        },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.past_damage_relations.forEach((versionData: any) => {
        // get generation number from url
        const genNumber: Generations = parseInt(
            versionData.generation.url.split('generation/').pop() as string,
            10,
        );

        if (!Generations[genNumber]) {
            throw new Error(`Invalid generation number ${genNumber}`);
        }

        const versionRelations = mapDamageRelations(versionData.damage_relations);
        typeData.versions[genNumber] = versionRelations;
    });

    cachedTypes[type] = typeData;
    delete cachedTypes[type].primaryType;

    return typeData;
}
