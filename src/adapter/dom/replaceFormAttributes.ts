/**
 * @deprecated
 * @fileoverview Handles signup forms on destination pages that were reached via hash URLs.
 * Extracts plan IDs from URL hash fragments and applies them to signup forms on the current page.
 *
 * @example
 * // URL: /pricing#/ms/signup/mem_old123
 * // Form: <form data-ms-form="signup"></form>
 * // Result: <form data-ms-form="signup" data-ms-plan:add="pln_new456"></form>
 *
 * @example
 * // Called on page load to process forms that need plan attributes from URL hash
 * // Handles cases where user navigated to page with signup intent via hash URL
 */


import {logger} from "@utils/logger";
import {config} from "@/config";
import {getPlanAttribute} from "@dom/planAttributeHelpers";

export function handleSignupPageForms() {
    logger('debug', '[Adapter] Checking for signup forms on page load');

    // Find signup forms on the current page
    const signupForms = document.querySelectorAll('[data-ms-form="signup"]');

    if (signupForms.length === 0) {
        logger('debug', '[Adapter] No signup forms found on this page');
        return;
    }

    logger('warn', `[Adapter] Found ${signupForms.length} signup form(s) on page`);

    // Extract plan ID from URL hash
    const urlHash = window.location.hash;
    const match = urlHash.match(/#\/ms\/signup\/(.+)$/);

    if (!match || !match[1]) {
        logger('debug', `[Adapter] No plan ID found in URL hash: ${urlHash}`);
        return;
    }

    const extractedId = match[1];
    logger('debug', `[Adapter] Extracted plan ID from URL: ${extractedId}`);

    // Get new ID from config
    const newId = config.adapter.importedMemberships?.[extractedId];
    if (!newId) {
        logger('error', `[Adapter] Extracted Plan ID from URL "${extractedId}" not found in config.importedMemberships`);
        return;
    }

    const attr = getPlanAttribute(newId);
    if (!attr) {
        logger('error', `[Adapter] Invalid new plan ID format "${newId}"`);
        return;
    }

    // Add the plan attribute to all signup forms
    signupForms.forEach((form, index) => {
        form.setAttribute(attr, newId);
        logger('debug', `[Adapter] Added ${attr}="${newId}" to signup form ${index + 1}`);
    });

    logger('info', `[Adapter] Successfully updated ${signupForms.length} signup form(s) with plan ID ${newId}`);
}
