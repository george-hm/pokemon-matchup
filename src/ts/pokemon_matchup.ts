import { Generations } from './generations';
import { Pokemon } from './pokemon';
import { getMatchupForGeneration, getTypesForGeneration } from './types';

export interface PokemonMatchup {
    to: { [type: string]: number};
    from: { [type: string]: number};
}

export function getPokemonMatchup(
    pokemonYou: Pokemon,
    pokemonOpponent: Pokemon,
    generation: Generations,
): PokemonMatchup {
    const yourTypes = getTypesForGeneration(
        pokemonYou.typeVersions,
        generation,
    );
    const opponentTypeNames = getTypesForGeneration(
        pokemonOpponent.typeVersions,
        generation,
    ).map((type) => type.name);
    const pM: PokemonMatchup = {
        to: {},
        from: {},
    };
    for (let ii = 0; ii < yourTypes.length; ii += 1) {
        const yourType = yourTypes[ii].name;
        const matchups = getMatchupForGeneration(
            yourTypes[ii],
            generation,
        );
        for (let jj = 0; jj < opponentTypeNames.length; jj += 1) {
            const opponentType = opponentTypeNames[jj];
            if (matchups.doubleDamageTo.includes(opponentType)) {
                pM.to[yourType] = (pM.to[yourType] || 0) + 1;
            }
            if (matchups.halfDamageTo.includes(opponentType)) {
                pM.to[yourType] = (pM.to[yourType] || 0) - 1;
            }
            if (matchups.noDamageTo.includes(opponentType)) {
                pM.to[yourType] = (pM.to[yourType] || 0) - 1;
            }
            if (matchups.doubleDamageFrom.includes(opponentType)) {
                pM.from[opponentType] = (pM.from[opponentType] || 0) + 1;
            }
            if (matchups.halfDamageFrom.includes(opponentType)) {
                pM.from[opponentType] = (pM.from[opponentType] || 0) - 1;
            }
            if (matchups.noDamageFrom.includes(opponentType)) {
                pM.from[opponentType] = (pM.from[opponentType] || 0) - 1;
            }
            // filter out "neutral" matchups
            if (pM.to[yourType] === 0) {
                delete pM.to[yourType];
            }
            if (pM.from[opponentType] === 0) {
                delete pM.from[opponentType];
            }
        }
    }

    return pM;
}
