import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {defineConfig} from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig((_params) => {
    return {
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
                '@adapter': resolve(__dirname, './src/adapter'),
                '@utils': resolve(__dirname, './src/utils'),
                '@dom': resolve(__dirname, './src/adapter/dom'),
            }
        },
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
            },
            terserOptions: {
                compress: {
                    drop_console: false,
                },
                mangle: {
                    keep_fnames: true,
                },
                format: {
                    comments: false,
                },
            }

        },
        test: {
            environment: 'jsdom', // Needed for DOM testing
            globals: true,
        },
        server: {
            cors: true
        }
    }
})