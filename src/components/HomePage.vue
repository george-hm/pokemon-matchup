<script setup lang="ts">
import { reactive } from 'vue';
import { HomePageModel, SelectOption } from '@/ts/component_interfaces';
import { getAllPokemonSelectOptions } from '@/ts/pokemon';
import MatchupAnalysis from './MatchupAnalysis.vue';
import PokemonPicker from './PokemonPicker.vue';

const model: HomePageModel = reactive({
    generation: '8',
    pokemonYou: 129,
    pokemonOpponent: 129,
});
const selectOptions: SelectOption[] = await getAllPokemonSelectOptions();

</script>

<template>
    <n-space justify="center">
        <n-h4 class="space_heading">Generation</n-h4>
        <n-radio-group v-model:value="model.generation">
            <n-radio-button value="1" label="RBY"/>
            <n-radio-button value="2" label="GSC"/>
            <n-radio-button value="3" label="RSE/FRLG"/>
            <n-radio-button value="4" label="DPP/HGSS"/>
            <n-radio-button value="5" label="BW"/>
            <n-radio-button value="6" label="XY"/>
            <n-radio-button value="7" label="USUM"/>
            <n-radio-button value="8" label="SWSH"/>
        </n-radio-group>
    </n-space>
    <n-divider />
    <n-grid x-gap="24" cols="1 900:2">
        <n-grid-item>
            <n-h4>You</n-h4>
            <PokemonPicker v-model="model.pokemonYou" :options=selectOptions />
        </n-grid-item>
        <n-grid-item>
            <n-h4>Opponent</n-h4>
            <PokemonPicker v-model=model.pokemonOpponent :options=selectOptions />
        </n-grid-item>
    </n-grid>
    <n-divider />
    <MatchupAnalysis v-model="model"/>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .space_heading {
        margin-right: 10px;
        margin-bottom: 0;
    }
</style>
