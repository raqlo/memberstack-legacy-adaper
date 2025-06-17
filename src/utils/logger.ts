import {config} from '@/config';
import {consola} from "consola/browser";
import type {LogType} from "consola/browser";

export function logger(type: LogType, message: any, ...args: any[]) {
    consola.level = 5
    if (config.debug) {
        consola[type](message, ...args);
    }
}
