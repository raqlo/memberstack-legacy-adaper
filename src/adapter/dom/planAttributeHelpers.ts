/**
 * @fileoverview Core utilities for transforming Memberstack plan and membership attributes.
 * Handles conversion from v1 data-ms-plan/data-ms-membership to v2 format with proper ID mapping.
 *
 * @example
 * // Before: <button data-ms-plan="mem_old123">Subscribe</button>
 * // After:  <button data-ms-plan:add="pln_new456">Subscribe</button>
 *
 * @example
 * // Before: <a href="#" data-ms-membership="mem_old789">Join</a>
 * // After:  <a href="#" data-ms-price:update="prc_new123" data-ms-modal="signup">Join</a>
 */

import {logger} from "@utils/logger";
import type {MembershipsMap} from "@/config";

export function getPlanAttribute(id: string): string | null {
    logger('debug', `[Adapter] Getting plan attribute for ID: ${id}`);

    if (id.startsWith("prc_")) {
        logger('debug', `[Adapter] ID "${id}" is a price ID, returning data-ms-price:update`);
        return "data-ms-price:update";
    }
    if (id.startsWith("pln_")) {
        logger('debug', `[Adapter] ID "${id}" is a plan ID, returning data-ms-plan:add`);
        return "data-ms-plan:add";
    }
    logger('error', `[Adapter] Unknown ID format: "${id}" - expected prc_ or pln_ prefix`);
    return null;
}

export function replaceDataMsPlanAttribute(
    el: HTMLElement,
    oldId: string,
    importedMemberships: MembershipsMap[]
) {
    logger('debug', `[Adapter] Replacing plan attribute for old ID: ${oldId}`);

    const newId = importedMemberships.find(m => m.oldId === oldId)?.newId;
    if (!newId) {
        logger('error', `[Adapter] Plan ID "${oldId}" not found in importedMemberships mapping`);
        return;
    }

    const attr = getPlanAttribute(newId);
    if (!attr) {
        logger('error', `[Adapter] Invalid new plan ID format "${newId}" for old ID "${oldId}"`);
        return;
    }

    el.removeAttribute("data-ms-plan");
    el.setAttribute(attr, newId);

    logger('debug', `[Adapter] Successfully replaced plan attribute: ${oldId} -> ${newId} (${attr})`);
}

export function replaceDataMsMembershipAttribute(
    el: HTMLElement,
    oldId: string,
    importedMemberships: MembershipsMap[]
) {
    logger('debug', `[Adapter] Replacing membership attribute for old ID: ${oldId}`);

    const newId = importedMemberships.find(m => m.oldId === oldId)?.newId;
    if (!newId) {
        logger('error', `[Adapter] Membership ID "${oldId}" not found in importedMemberships mapping`);
        return;
    }

    // Use the same logic as plans - membership attributes become plan attributes
    const attr = getPlanAttribute(newId);
    if (!attr) {
        logger('error', `[Adapter] Invalid new membership ID format "${newId}" for old ID "${oldId}"`);
        return;
    }

    el.removeAttribute("data-ms-membership");
    el.setAttribute(attr, newId);

    // Check if this is a link element with href="#" - if so, add modal attribute
    if (el.tagName.toLowerCase() === 'a') {
        const href = el.getAttribute('href');
        if (href === '#') {
            el.setAttribute("data-ms-modal", "signup");
            logger('debug', `[Adapter] Added data-ms-modal="signup" to link element`);
        }
    }

    logger('debug', `[Adapter] Successfully replaced membership attribute: ${oldId} -> ${newId} (${attr})`);
}

export function processDataMsPlanAttributes(importedMemberships: MembershipsMap[]): number {
    logger('debug', '[Adapter] Processing data-ms-plan attributes');

    const planElements = document.querySelectorAll("[data-ms-plan]");

    if (planElements.length) {
        logger('warn', `[Adapter] Found ${planElements.length} elements with data-ms-plan attribute`);
        planElements.forEach(el => {
            const oldId = el.getAttribute("data-ms-plan");
            if (oldId) {
                replaceDataMsPlanAttribute(el as HTMLElement, oldId, importedMemberships);
            }
        });
    }

    return planElements.length;
}

export function processDataMsMembershipAttributes(importedMemberships: MembershipsMap[]): number {
    logger('debug', '[Adapter] Processing data-ms-membership attributes');

    const membershipElements = document.querySelectorAll("[data-ms-membership]");

    if (membershipElements.length) {
        logger('warn', `[Adapter] Found ${membershipElements.length} elements with data-ms-membership attribute`);

        membershipElements.forEach(el => {
            const oldId = el.getAttribute("data-ms-membership");
            if (oldId) {
                replaceDataMsMembershipAttribute(el as HTMLElement, oldId, importedMemberships);
            }
        });
    }

    return membershipElements.length;
}