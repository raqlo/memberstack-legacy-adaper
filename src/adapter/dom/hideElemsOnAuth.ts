import {isMemberAuthV2} from "@utils/sessions";
import {logger} from "@utils/logger";

export function hideLoginModalOnAuth() {
    logger('debug', '[Adapter] Checking for login modal(s) on page load')
    const loginModals = document.querySelectorAll('[data-ms-modal="login"], [ms-modal="login"]')
    if (loginModals.length === 0) {
        return
    }
    if (isMemberAuthV2()) {
        logger('warn', `[Adapter] ${loginModals.length} login modal(s) were hidden on this page`)
        loginModals.forEach(el => el.setAttribute('style', 'display: none'))
    }
}