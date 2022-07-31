import { Pokemon } from './pokemon';
import { Type } from './types';

export interface PokemonMatchup {
    yourTypeA: { [type: string]: number};
    opponentTypeA: { [type: string]: number};
}

export function getPokemonMatchup(pokemonYou: Pokemon, pokemonOpponent: Pokemon): PokemonMatchup {
    const yourTypes = pokemonYou.types;
    const opponentTypeNames = pokemonOpponent.types.map((type: Type) => type.name);
    const pM: PokemonMatchup = {
        yourTypeA: {},
        opponentTypeA: {},
    };
    for (let ii = 0; ii < yourTypes.length; ii += 1) {
        const yourType = yourTypes[ii].name;
        const matchups = yourTypes[ii].versions.latest; // @TODO use generation here
        for (let jj = 0; jj < opponentTypeNames.length; jj += 1) {
            const opponentType = opponentTypeNames[jj];
            if (matchups.doubleDamageTo.includes(opponentType)) {
                pM.yourTypeA[yourType] = (pM.yourTypeA[yourType] || 0) + 1;
            }
            if (matchups.halfDamageTo.includes(opponentType)) {
                pM.yourTypeA[yourType] = (pM.yourTypeA[yourType] || 0) - 1;
            }
            if (matchups.noDamageTo.includes(opponentType)) {
                pM.yourTypeA[yourType] = (pM.yourTypeA[yourType] || 0) - 1;
            }
            if (matchups.doubleDamageFrom.includes(opponentType)) {
                pM.opponentTypeA[opponentType] = (pM.opponentTypeA[opponentType] || 0) + 1;
            }
            if (matchups.halfDamageFrom.includes(opponentType)) {
                pM.opponentTypeA[opponentType] = (pM.opponentTypeA[opponentType] || 0) - 1;
            }
            if (matchups.noDamageFrom.includes(opponentType)) {
                pM.opponentTypeA[opponentType] = (pM.opponentTypeA[opponentType] || 0) - 1;
            }
            // filter out "neutral" matchups
            if (pM.yourTypeA[yourType] === 0) {
                delete pM.yourTypeA[yourType];
            }
            if (pM.opponentTypeA[opponentType] === 0) {
                delete pM.opponentTypeA[opponentType];
            }
        }
    }

    return pM;
}
