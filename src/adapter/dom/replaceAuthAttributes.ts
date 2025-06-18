import {logger} from "@utils/logger";

export function replaceLogoutAttribute(el: HTMLElement) {
    logger('debug',`Replacing logout attribute for element:${el.tagName}`)

    // Remove old attributes and set new one
    el.removeAttribute("data-ms-logout");
    el.removeAttribute("ms-logout");
    el.setAttribute("data-ms-action", "logout");
}

export function replaceForgotPasswordAttribute(el: HTMLElement) {
    logger('debug',`Replacing forgot password attribute for element:${el.tagName}`)

    el.removeAttribute("ms-forgot");
    el.setAttribute("data-ms-modal", "forgot-password");
}

export function replaceLoginAttribute(el: HTMLElement) {
    logger('debug',`Replacing login attribute for element:${el.tagName}`)

    el.removeAttribute("ms-login");
    el.setAttribute("data-ms-modal", "login");
}

export function replaceSignupAttribute(el: HTMLElement) {
    logger('debug',`Replacing signup attribute for element:${el.tagName}`)

    el.removeAttribute("ms-signup");
    el.setAttribute("data-ms-modal", "signup");
}

export function updateAllLogoutAttributes() {
    logger('info', 'Starting attribute update process')

    // Handle data-ms-logout attributes
    const dataLogoutElements = document.querySelectorAll("[data-ms-logout]");
    if (dataLogoutElements.length > 0) {
        logger('warn',`Found ${dataLogoutElements.length} elements with deprecated data-ms-logout attribute`)
        dataLogoutElements.forEach(el => {
            replaceLogoutAttribute(el as HTMLElement);
        });
    }

    // Handle ms-logout attributes (without data- prefix)
    const logoutElements = document.querySelectorAll("[ms-logout]");
    if (logoutElements.length > 0) {
        logger('warn',`Found ${logoutElements.length} elements with deprecated ms-logout attribute`)
        logoutElements.forEach(el => {
            replaceLogoutAttribute(el as HTMLElement);
        });
    }

    // Handle ms-forgot attributes
    const forgotElements = document.querySelectorAll("[ms-forgot]");
    if (forgotElements.length > 0) {
        logger('warn',`Found ${forgotElements.length} elements with deprecated ms-forgot attribute`);
        forgotElements.forEach(el => {
            replaceForgotPasswordAttribute(el as HTMLElement);
        });
    }

    // Handle ms-login attributes
    const loginElements = document.querySelectorAll("[ms-login]");
    if (loginElements.length > 0) {
        logger('warn',`Found ${loginElements.length} elements with deprecated ms-login attribute`);
        loginElements.forEach(el => {
            replaceLoginAttribute(el as HTMLElement);
        });
    }

    const totalUpdated = dataLogoutElements.length + logoutElements.length + forgotElements.length + loginElements.length;
    logger('info',`Attribute update completed. Updated ${totalUpdated} elements total`);
}