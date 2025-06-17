import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {defineConfig} from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig((_params) => {
    return {
        build: {
            minify: 'terser',
            lib: {
                entry: 'src/main.ts', // or your entry point
                name: 'MemberStackAdapter',
                formats: ['iife'], // key setting
                fileName: () => `memberstack-adapter.js`,
            },
            rollupOptions: {
                external: ['jquery'],
                input: resolve(__dirname, 'src/main.ts'),
            }
        },
        test: {
            environment: 'jsdom', // Needed for DOM testing
            globals: true,
        },
    }
})