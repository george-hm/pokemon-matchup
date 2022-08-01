<script setup lang="ts">
import { reactive } from 'vue';
import { HomePageModel, SelectOption } from '@/ts/component_interfaces';
import { getAllPokemonSelectOptions } from '@/ts/pokemon';
import MatchupAnalysis from './MatchupAnalysis.vue';
import PokemonPicker from './PokemonPicker.vue';

const model: HomePageModel = reactive({
    generation: '8',
    pokemonYou: '129',
    pokemonOpponent: '129',
});
const selectOptions: SelectOption[] = await getAllPokemonSelectOptions();
</script>

<template>
    <n-space justify="center">
        <div>
            <n-h4 class="space_heading">Generation</n-h4>
            <n-radio-group class="space_radio_group" v-model:value="model.generation">
                <div class="radio_button_standalone">
                    <n-radio-button value="1" label="RBY"/>
                </div>
                <div class="radio_button_standalone">
                    <n-radio-button value="2" label="GSC"/>
                </div>
                <div class="radio_button_standalone">
                    <n-radio-button value="3" label="RSE/FRLG"/>
                </div>
                <div class="radio_button_standalone">
                    <n-radio-button value="4" label="DPP/HGSS"/>
                </div>
                <div class="radio_button_standalone">
                    <n-radio-button value="5" label="BW"/>
                </div>
                <div class="radio_button_standalone">
                    <n-radio-button value="6" label="XY"/>
                </div>
                <div class="radio_button_standalone">
                    <n-radio-button value="7" label="USUM"/>
                </div>
                <div class="radio_button_standalone">
                    <n-radio-button value="8" label="SWSH"/>
                </div>
            </n-radio-group>
        </div>
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
        margin-bottom: 0;
    }

    .space_radio_group {
        margin-left: -4px;
    }
    .radio_button_standalone {
        display: inline-block;
        margin: 4px;
    }
    .radio_button_standalone .n-radio-button {
        padding: 4px 14px;
    }
</style>
