<script setup lang="ts">
import { defineProps, ref, watch } from 'vue';
import { HomePageModel } from '@/ts/component_interfaces';
import { Type } from '@/ts/types';
import { getPokemonById } from '@/ts/pokemon';

const props = defineProps<{
    modelValue: HomePageModel,
}>();
const isNotReady = ref(true);
const analysisResults = ref(['']);

watch(props, async () => {
    const { pokemonYou, pokemonOpponent } = props.modelValue;
    isNotReady.value = true;
    const pokemonYouObj = await getPokemonById(pokemonYou);
    const pokemonOpponentObj = await getPokemonById(pokemonOpponent);
    isNotReady.value = false;

    const items: string[] = [];
    const yourName = pokemonYouObj.name;
    const opponentName = pokemonOpponentObj.name;
    const yourTypes = pokemonYouObj.types;
    const opponentTypeNames = pokemonOpponentObj.types.map((type: Type) => type.name);
    const yourTypeIsStrong : Set<string> = new Set();
    const yourTypeIsWeak : Set<string> = new Set();
    const opponentTypeIsStrong : Set<string> = new Set();
    const opponentTypeIsWeak : Set<string> = new Set();

    for (let ii = 0; ii < yourTypes.length; ii += 1) {
        const yourType = yourTypes[ii].name;
        const matchups = yourTypes[ii].versions.latest; // @TODO use generation here
        for (let jj = 0; jj < opponentTypeNames.length; jj += 1) {
            const opponentType = opponentTypeNames[jj];
            if (matchups.doubleDamageTo.includes(opponentType)) {
                yourTypeIsStrong.add(yourType);
            }
            if (matchups.halfDamageTo.includes(opponentType)) {
                yourTypeIsWeak.add(yourType);
            }
            if (matchups.noDamageTo.includes(opponentType)) {
                yourTypeIsWeak.add(yourType);
            }
            if (matchups.doubleDamageFrom.includes(opponentType)) {
                opponentTypeIsStrong.add(opponentType);
            }
            if (matchups.halfDamageFrom.includes(opponentType)) {
                opponentTypeIsWeak.add(opponentType);
            }
            if (matchups.noDamageFrom.includes(opponentType)) {
                opponentTypeIsWeak.add(opponentType);
            }
        }
    }
    yourTypeIsStrong.forEach((type: string) => items.push(`Your ${type} type is Strong attacking ${opponentName}`));
    yourTypeIsWeak.forEach((type: string) => items.push(`Your ${type} type is Weak attacking ${opponentName}`));
    opponentTypeIsStrong.forEach((type: string) => items.push(`Their ${type} type is Strong attacking your ${yourName}`));
    opponentTypeIsWeak.forEach((type: string) => items.push(`Their ${type} type is Weak attacking your ${yourName}`));
    analysisResults.value = items;
}, {
    immediate: true,
});
</script>

<template>
    <n-spin :show=isNotReady>
        <n-table :striped=true>
            <thead>
            <tr>
                <th>Analysis</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(item) in analysisResults" :key="item">
                <td>{{item}}</td>
            </tr>
            </tbody>
        </n-table>
    </n-spin>
</template>
