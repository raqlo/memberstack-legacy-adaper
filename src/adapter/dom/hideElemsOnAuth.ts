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

export function hideProfileModalOnUnAuth() {
    logger('debug', '[Adapter] Checking for profile modal(s) on page load')
    const profileModals = document.querySelectorAll('[data-ms-modal="profile"], [ms-modal="profile"]')
    if(profileModals.length === 0) {
        return
    }
    if(!isMemberAuthV2()) {
        logger('warn', `[Adapter] ${profileModals.length} profile modal(s) were hidden on this page`)
        profileModals.forEach(el => el.setAttribute('style', 'display: none'))
    }
}