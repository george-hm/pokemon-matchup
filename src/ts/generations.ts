/* eslint-disable import/prefer-default-export */
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
