import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

// Apply color theme attributes according to AGENTS.md
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.setAttribute('data-theme-id', 'obsidian');
document.documentElement.style.colorScheme = 'dark';

createApp(App).mount('#app');
