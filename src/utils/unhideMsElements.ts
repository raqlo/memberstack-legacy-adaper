/**
 * @deprecated
 * MS 1 hides elements on init, we need to unhide them and let MS 2 take over.
 * MS 2 will dynamically remove elements depending on the member authentication permissions instead of just hiding them.
 */

import {logger} from "./logger";
import {MS_SELECTORS_HIDDEN_ON_INIT} from "./enums";

export function unhideMsElements() {
    document.addEventListener('DOMContentLoaded', () => {
        logger('info', '[Adapter] Unhiding elements on init...')
        MS_SELECTORS_HIDDEN_ON_INIT.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                const clone = el.cloneNode(true);
                el.parentNode?.replaceChild(clone, el);
                // if ((clone as Element).attributes.getNamedItem('style')?.value.includes('display: none')) {
                //     (clone as Element).remove()
                // }
            });
        })
    })
}