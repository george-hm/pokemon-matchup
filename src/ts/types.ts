import axios from 'axios';
import { convertGenStringToEnum, Generations } from './generations';

const BASE_URL = 'https://pokeapi.co/api/v2/';

interface RawDamageRelation {
    // using Array<> here because its more readable
    [key: string]: Array<{ name: string; }>;
}

// this is the raw response we get from the api
export interface RawTypeResponse {
    slot: number;
    type: { name: string; };
}

interface DamageMatchups {
    doubleDamageFrom: string[],
    doubleDamageTo: string[],
    halfDamageFrom: string[],
    halfDamageTo: string[],
    noDamageFrom: string[],
    noDamageTo: string[],
}

export interface Versions<T> {
    [Generations.GEN_LATEST]: T;
    [Generations.GEN_1]?: T;
    [Generations.GEN_2]?: T;
    [Generations.GEN_3]?: T;
    [Generations.GEN_4]?: T;
    [Generations.GEN_5]?: T;
    [Generations.GEN_6]?: T;
    [Generations.GEN_7]?: T;
    [Generations.GEN_8]?: T;
}

export interface Type {
    name: string;
    generation: Generations;
    damageRelations: DamageMatchups;
    earliestGeneration: Generations;
}

export interface MinimalTypeInfo {
    name: string;
    primary: boolean;
}

interface TypeAndVersion {
    [key: string]: Versions<Type>;
}

const cachedTypes: TypeAndVersion = {};

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

export async function getTypeVersionsFromName(
    type: string,
): Promise<Versions<Type>> {
    // handle caching
    if (cachedTypes[type]) {
        const cached = cachedTypes[type];
        // duplicate to avoid modifying the cached version
        const dupedCache = { ...cached };
        return dupedCache;
    }

    const response = await axios.get(`${BASE_URL}type/${type}`);
    const data = response?.data;
    if (!data) {
        throw new Error(`No type data for ${type}`);
    }

    const earliestGeneration = convertGenStringToEnum(data.generation.url);

    const versions: Versions<Type> = {
        [Generations.GEN_LATEST]: {
            name: data.name,
            generation: Generations.GEN_LATEST,
            damageRelations: mapDamageRelations(data.damage_relations),
            earliestGeneration,
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
        versions[genNumber] = {
            name: versionData.name,
            generation: genNumber,
            damageRelations: versionRelations,
            earliestGeneration,
        };
    });

    cachedTypes[type] = { ...versions };

    return versions;
}

function getClosestGen(versions: Versions<unknown>, gen: Generations): Generations {
    // get the specific gen if it exists
    if (versions[gen]) {
        return gen;
    }

    // if not, see if we have the data for any past generations
    const pastGenerations = Object.keys(versions).filter(
        (version) => version !== Generations.GEN_LATEST,
    );

    if (!pastGenerations.length) {
        return Generations.GEN_LATEST;
    }

    // get the closest higher generation
    const closestHigherGen = pastGenerations.reduce((closest, current) => {
        if (current > gen) {
            return current;
        }
        return closest;
    });

    // if its not higher, just return the latest
    if (!closestHigherGen || closestHigherGen < gen) {
        return Generations.GEN_LATEST;
    }

    // get the closest lower generation
    const closestLowerGen = pastGenerations.reduce((closest, current) => {
        if (current < gen) {
            return current;
        }
        return closest;
    });

    return closestLowerGen as Generations;
}

export function getTypesForGeneration(
    typeVersions: Versions<MinimalTypeInfo[]>,
    gen: Generations,
): Type[] {
    const closestGen = getClosestGen(typeVersions, gen);
    // first get all the type names for this generation
    const minimalTypesForGen = typeVersions[closestGen] as MinimalTypeInfo[];

    // load the type fully
    const loadedTypeVersions = minimalTypesForGen.map((type) => cachedTypes[type.name]);

    // then load the type for the specific gen
    const typesForGen = loadedTypeVersions.map((type) => type[getClosestGen(type, gen)] as Type);

    // delete the type if it didn't exist in this generation
    for (let i = 0; i < typesForGen.length; i += 1) {
        const type = typesForGen[i];
        if (type.earliestGeneration > gen) {
            typesForGen.splice(i, 1);
            i -= 1;
        }
    }

    return typesForGen;
}
