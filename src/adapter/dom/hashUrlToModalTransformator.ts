/**
 * @fileoverview Handles transformation of hash-based URLs (#/ms/signup/, #/ms/login) into modal attributes.
 * Converts old Memberstack v1 hash URLs to v2 modal system.
 *
 * @example
 * // Before: <a href="#/ms/signup/mem_123">Sign Up</a>
 * // After: <a href="#" data-ms-modal="signup" data-ms-plan:add="pln_456">Sign Up</a>
 *
 * @example
 * // Before: <a href="#/ms/login">Login</a>
 * // After: <a href="#" data-ms-modal="login">Login</a>
 */

import {logger} from "@utils/logger";
import {getPlanAttribute} from "./planAttributeHelpers";

export function replaceSignupHref(
    el: HTMLElement,
    extractedId: string,
    importedMemberships: Record<string, string>
) {
    logger('debug', `[Adapter] Replacing signup href for extracted ID: ${extractedId}`);

    const newId = importedMemberships[extractedId];
    if (!newId) {
        logger('error', `[Adapter] Signup href ID "${extractedId}" not found in importedMemberships mapping`);
        return;
    }

    const attr = getPlanAttribute(newId);
    if (!attr) {
        logger('error', `[Adapter] Invalid new signup ID format "${newId}" for old ID "${extractedId}"`);
        return;
    }

    // Replace href with modal attribute and add plan attribute
    el.setAttribute("href", "#");
    el.setAttribute("data-ms-modal", "signup");
    el.setAttribute(attr, newId);

    logger('debug', `[Adapter] Successfully replaced signup href: ${extractedId} -> ${newId} with modal and ${attr}`);
}

export function replaceLoginHref(el: HTMLElement) {
    logger('debug', '[Adapter] Replacing login href with modal');

    // Replace href with modal attribute
    el.setAttribute("href", "#");
    el.setAttribute("data-ms-modal", "login");

    logger('debug', '[Adapter] Successfully replaced login href with modal');
}

export function processHashSignupUrls(importedMemberships: Record<string, string>): number {
    logger('debug', '[Adapter] Processing hash-only signup URLs');

    const signupElements = document.querySelectorAll('a[href^="#/ms/signup/"]');

    if (signupElements.length > 0) {
        logger('warn', `[Adapter] Found ${signupElements.length} elements with hash-only signup href attributes that will be converted to modal`);

        signupElements.forEach(el => {
            const href = el.getAttribute("href");
            if (href) {
                const match = href.match(/#\/ms\/signup\/(.+)$/);
                if (match && match[1]) {
                    const extractedId = match[1];
                    replaceSignupHref(el as HTMLElement, extractedId, importedMemberships);
                } else {
                    logger('error', `[Adapter] Failed to extract ID from href: ${href}`);
                }
            }
        });
    }

    return signupElements.length;
}

export function processHashLoginUrls(): number {
    logger('debug', '[Adapter] Processing hash-only login URLs');

    const loginElements = document.querySelectorAll('a[href="#/ms/login"]');

    if (loginElements.length > 0) {
        logger('warn', `[Adapter] Found ${loginElements.length} elements with login href attributes that will be converted to modal`);

        loginElements.forEach(el => {
            replaceLoginHref(el as HTMLElement);
        });
    }

    return loginElements.length;
}