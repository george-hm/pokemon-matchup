import axios from 'axios';
import {
    convertVersionGroupStringToEnum, Generations, getClosestGen, Versions,
} from './generations';
import { getTypeForGeneration, getTypeVersionsFromName, Type } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export interface MoveDetail {
    type: Type;
    name: string;
    accuracy: number;
    power: number;
    pp: number;
    priority: number;
    damageType: 'special' | 'physical';
}

// raw move data from the api
interface RawMoveData {
    // eslint-disable-next-line camelcase
    damage_class: { name: 'special' | 'physical'; };
    name: string;
    accuracy: number;
    type: { name: string; };
    power: number;
    pp: number;
    priority: number;
    // eslint-disable-next-line camelcase
    version_group: { url: string; };
}

const moveCache: { [key: string]: Versions<MoveDetail>; } = {};

async function buildMoveFromRawMoveData(
    rawMoveData: RawMoveData,
    generation: Generations,
    fallback: MoveDetail,
): Promise<MoveDetail> {
    const rawTypeName: string | undefined = rawMoveData?.type?.name;
    const moveData = {
        name: rawMoveData.name,
        accuracy: rawMoveData?.accuracy || fallback.accuracy,
        damageType: rawMoveData?.damage_class?.name || fallback.damageType,
        type: rawTypeName ? await getTypeForGeneration(rawTypeName, generation) : fallback.type,
        power: rawMoveData?.power || fallback.power,
        pp: rawMoveData?.pp || fallback.pp,
        priority: rawMoveData?.priority || fallback.priority,
    };

    return moveData;
}

export async function getAllPokemonMoveNames(): Promise<string[]> {
    const response = await axios.get(`${BASE_URL}move?limit=10000`);
    const data = response?.data;
    if (!data) {
        throw new Error('No data');
    }

    return data.results.map((result: { name: string; }) => result.name);
}

export async function loadMove(name: string): Promise<Versions<MoveDetail>> {
    if (moveCache[name]) {
        return { ...moveCache[name] };
    }

    const rawMoveData = (await axios.get(`${BASE_URL}move/${name}`))?.data;
    if (!rawMoveData) {
        throw new Error(`No move data for ${name}`);
    }

    const allMoveData: Versions<MoveDetail> = {
        [Generations.GEN_LATEST]: {
            accuracy: rawMoveData.accuracy,
            name: rawMoveData.name,
            damageType: rawMoveData.damage_class.name,
            type: (
                await getTypeVersionsFromName(rawMoveData.type.name)
            )[Generations.GEN_LATEST],
            power: rawMoveData.power,
            pp: rawMoveData.pp,
            priority: rawMoveData.priority,
        },
    };

    const promises: Promise<never>[] = rawMoveData?.past_values?.map(
        async (pastValue: RawMoveData) => {
            const generation = await convertVersionGroupStringToEnum(pastValue.version_group.url);
            const moveData = await buildMoveFromRawMoveData(
                pastValue,
                generation,
                allMoveData[Generations.GEN_LATEST],
            );
            allMoveData[generation] = moveData;
        },
    );

    await Promise.all(promises);
    moveCache[name] = allMoveData;

    return allMoveData;
}

export async function loadMoveForGeneration(
    name: string,
    generation: Generations,
): Promise<MoveDetail> {
    const move = await loadMove(name);
    const closestGen = getClosestGen(move, generation);
    return move[closestGen] as MoveDetail;
}
