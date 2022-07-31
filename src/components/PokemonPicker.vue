<script setup lang="ts">
import { computed, defineEmits, defineProps } from 'vue';
import { SelectOption } from '@/ts/component_interfaces';

const emits = defineEmits(['update:modelValue']);
const props = defineProps<{
    modelValue: number,
    options: SelectOption[],
}>();
const imageURL = computed(() => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${props.modelValue}.png`);

async function inputChanged(id: string) {
    emits('update:modelValue', id);
}
</script>

<template>
  <div>
    <n-image
      width="96"
      :src=imageURL
    />
    <n-select
      filterable
      placeholder="Select a Pokemon"
      :default-value=modelValue
      :options=options
      :on-update:value=inputChanged
    />
  </div>
</template>
