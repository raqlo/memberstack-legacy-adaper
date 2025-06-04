import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {defineConfig} from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig((_params) => {
    return {
        build: {
            minify: 'terser',
            lib: {
                entry: resolve(__dirname, 'src/main.ts'),
                name: 'MemberstackLegacyAdapter',
                fileName: 'main',
            },
            rollupOptions: {
                external: ['jquery'],
                output: {
                    format: 'iife',
                    globals: {
                        jquery: '$'
                    }
                }
            }
        },
    }
})