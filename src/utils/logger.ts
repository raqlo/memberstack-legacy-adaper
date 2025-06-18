import {config} from '@/config';
import {consola} from "consola/browser";
import type {LogType} from "consola/browser";

// Log level mapping (consola uses numeric levels)
const LOG_LEVELS = {
    'silent': 0,
    'fatal': 0,
    'error': 1,
    'warn': 2,
    'info': 3,
    'debug': 4,
    'trace': 5,
    'verbose': 5
} as const;

type LogLevel = keyof typeof LOG_LEVELS;


export function logger(type: LogType, message: any, ...args: any[]) {
    // Get log level from config, default to 'info' if not specified
    const configLogLevel: LogLevel = config.logLevel || 'info';

    // Set consola level based on config
    consola.level = LOG_LEVELS[configLogLevel];

    // Always log if debug is true (backward compatibility)
    // Or log if the current log type meets the minimum level
    if (config.debug || shouldLog(type, configLogLevel)) {
        consola[type](message, ...args);
    }
}


function shouldLog(type: LogType, configLevel: LogLevel): boolean {
    const typeLevel = LOG_LEVELS[type as LogLevel];
    const minLevel = LOG_LEVELS[configLevel];

    // Log if the message type level is at or below the configured minimum level
    return typeLevel <= minLevel;
}
