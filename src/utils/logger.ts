import config from '../config.js';

export function log(...args: any[]) {
    if (config.debug) {
        console.log('[MemberStackAdapter]', ...args);
    }
}
