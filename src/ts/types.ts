import axios from 'axios';
import { convertGenStringToEnum, Generations } from './generations';

const BASE_URL = 'https://pokeapi.co/api/v2/';

interface RawDamageRelation {
    // using Array<> here because its more readable
    [key: string]: Array<{ name: string; }>;
}

// this is the raw response we get from the api
interface RawTypeResponse {
    // eslint-disable-next-line camelcase
    past_types: Array<{
        generation: { url: string; };
        types: Array<{
            slot: number;
            type: { name: string; };
        }>;
    }>;
    types: Array<{
        slot: number;
        type: { name: string; };
    }>;
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
        // duplicate to avoid modifying the cached version
        const dupedCache = { ...cached };
        dupedCache.primaryType = primaryType;
        return dupedCache;
    }

    console.log(`Fetching type ${type}`);

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

    cachedTypes[type] = { ...typeData };
    delete cachedTypes[type].primaryType;

    return typeData;
}

export function getMatchupForGeneration(type: Type, gen: Generations): DamageMatchups {
    // first see if we have the data for the generation
    if (type.versions[gen]) {
        return type.versions[gen] as DamageMatchups;
    }

    // if not, see if we have the data for any past generations
    const pastGenerations = Object.keys(type.versions).filter(
        (version) => version !== Generations.GEN_LATEST,
    );

    if (!pastGenerations.length) {
        return type.versions[Generations.GEN_LATEST] as DamageMatchups;
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
        return type.versions[Generations.GEN_LATEST] as DamageMatchups;
    }

    // get the closest lower generation
    const closestLowerGen = pastGenerations.reduce((closest, current) => {
        if (current < gen) {
            return current;
        }
        return closest;
    });

    return type.versions[closestLowerGen as Generations] as DamageMatchups;
}

export async function buildFromRawTypes(rawTypes: RawTypeResponse) {
    const types: Type[] = await Promise.all(
        rawTypes.types.map(
            async (type) => buildType(
                type.type.name,
                type.slot === 1,
            ),
        ),
    );

    const typeVersions: { [key in Generations]?: Type[] } = {};
    const promises: Promise<Type>[] = [];
    for (let i = 0; i < rawTypes.past_types.length; i += 1) {
        const gen = convertGenStringToEnum(rawTypes.past_types[i].generation.url);
        const genType = rawTypes.past_types[i].types;
        typeVersions[gen] = [];
        for (let j = 0; j < genType.length; j += 1) {
            const type = genType[j];
            const prom = buildType(
                type.type.name,
                type.slot === 1,
            );

            prom.then((builtType) => {
                typeVersions?.[gen]?.push(builtType);
            });
            promises.push(prom);
        }
    }
    await Promise.all(promises);

    return {
        types,
        typeVersions,
    };
}
