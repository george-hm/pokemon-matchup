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

export async function buildType(type: string, primaryType: boolean): Promise<Type> {
    // handle caching
    if (cachedTypes[type]) {
        const cached = cachedTypes[type];
        cached.primaryType = primaryType;
    }

    const response = await axios.get(`${BASE_URL}type/${type}`);
    const data = response?.data;
    if (!data) {
        throw new Error(`No type data for ${type}`);
    }

    const damageRelations: RawDamageRelation = data.damage_relations;
    const mapRelation = (rawType: { name: string; }): string => rawType.name;
    const typeData: Type = {
        name: data.name,
        primaryType,
        versions: {
            [Generations.GEN_LATEST]: {
                doubleDamageFrom: damageRelations.double_damage_from.map(mapRelation),
                doubleDamageTo: damageRelations.double_damage_to.map(mapRelation),
                halfDamageFrom: damageRelations.half_damage_from.map(mapRelation),
                halfDamageTo: damageRelations.half_damage_to.map(mapRelation),
                noDamageFrom: damageRelations.no_damage_from.map(mapRelation),
                noDamageTo: damageRelations.no_damage_to.map(mapRelation),
            },
        },
    };

    // data.past_damage_relations.forEach(versionData => {
    //     // get generation number from url
    //     const genNumber = parseInt(
    //         versionData.generation.url.split('generation/').pop(),
    //         10,
    //     );
    //     const version = Generations[genNumber];
    //     const damageRelations: RawDamageRelation = versionData.damage_relations;
    // });

    cachedTypes[type] = typeData;
    delete cachedTypes[type].primaryType;

    return typeData;
}
