import { createApp } from 'vue';
import {
    create,
    NDivider,
    NH4,
    NImage,
    NInputNumber,
    NGrid,
    NGridItem,
    NRadioButton,
    NRadioGroup,
    NSelect,
    NSpace,
    NSpin,
    NTable,
} from 'naive-ui';
import App from './App.vue';

const naive = create({
    components: [
        NDivider,
        NH4,
        NImage,
        NInputNumber,
        NGrid,
        NGridItem,
        NRadioButton,
        NRadioGroup,
        NSelect,
        NSpace,
        NSpin,
        NTable,
    ],
});
createApp(App)
    .use(naive)
    .mount('#app');
