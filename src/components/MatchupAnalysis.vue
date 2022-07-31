<script setup lang="ts">
import { defineProps, ref, watch } from 'vue';
import { HomePageModel } from '@/ts/component_interfaces';
import { getPokemonById } from '@/ts/pokemon';
import { PokemonMatchup, getPokemonMatchup } from '@/ts/pokemon_matchup';

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
    const pM: PokemonMatchup = getPokemonMatchup(pokemonYouObj, pokemonOpponentObj);

    const toTypes = Object.keys(pM.to);
    for (let index = 0; index < toTypes.length; index += 1) {
        const type = toTypes[index];
        const effectiveness = pM.to[type] > 0 ? 'Strong' : 'Weak';
        items.push(`Your ${type} type is ${effectiveness} attacking ${opponentName}`);
    }
    const fromTypes = Object.keys(pM.from);
    for (let index = 0; index < fromTypes.length; index += 1) {
        const type = fromTypes[index];
        const effectiveness = pM.from[type] > 0 ? 'Strong' : 'Weak';
        items.push(`Their ${type} type is ${effectiveness} attacking your ${yourName}`);
    }
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
