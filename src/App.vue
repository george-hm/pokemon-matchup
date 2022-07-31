<script setup lang="ts">
import HomePage from './components/HomePage.vue';
</script>

<template>
    <Suspense>
        <HomePage/>
        <template #fallback>
            Loading...
        </template>
    </Suspense>
</template>

<style>
    body {
        padding: 24px;
    }
</style>
