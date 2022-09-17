import axios from 'axios';

// @TODO: support new generations without us having to update this file
export enum Generations {
    GEN_LATEST = 'latest',
    GEN_1 = 1,
    GEN_2 = 2,
    GEN_3 = 3,
    GEN_4 = 4,
    GEN_5 = 5,
    GEN_6 = 6,
    GEN_7 = 7,
    GEN_8 = 8,
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

const versionGroupCache: { [key: string]: Generations; } = {};

export function convertGenStringToEnum(gen: string): Generations {
    const genNum = parseInt(
        gen.split('generation/').pop() as string,
        10,
    );

    if (!Generations[genNum]) {
        throw new Error(`Invalid generation: ${gen}`);
    }

    return genNum as Generations;
}

export async function convertVersionGroupStringToEnum(versionGroup: string): Promise<Generations> {
    if (versionGroupCache[versionGroup]) {
        return versionGroupCache[versionGroup];
    }
    const data = (await axios.get(versionGroup))?.data;
    if (!data) {
        throw new Error(`Invalid version group: ${versionGroup}`);
    }

    const gen = convertGenStringToEnum(data.generation.url);
    versionGroupCache[versionGroup] = gen;

    return gen;
}

export function getClosestGen(versions: Versions<unknown>, gen: Generations): Generations {
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
