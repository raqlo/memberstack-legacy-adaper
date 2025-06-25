
/**
 * @fileoverview Handles data-ms-member attributes for displaying member-specific data.
 * Populates elements with member information like plan names, amounts, status, and formatted dates.
 *
 * @example
 * // Before: <span data-ms-member="membership.name">Loading...</span>
 * // After:  <span data-ms-member="membership.name">Premium Plan</span>
 *
 * @example
 * // Before: <div data-ms-member="membership.amount">$0</div>
 * // After:  <div data-ms-member="membership.amount">$29.99</div>
 *
 * @example
 * // Before: <span data-ms-member="signup-date.DateTimeFormat()">Loading...</span>
 * // After:  <span data-ms-member="signup-date.DateTimeFormat()">6/24/2025</span>
 */

import {logger} from "@utils/logger";
import {getCurrentMemberV2, isMemberAuthV2} from "@utils/sessions";
import type {v2CurrentMember, v2PlanItem} from "@/types/v2-entities";
import type {MembershipsMap} from "@/config";

function getNestedProperty(obj: v2PlanItem, path: string, importedMemberships: MembershipsMap[]): string {
    logger('debug', `[Adapter] Getting nested property "${path}" from plan item`);

    if (!obj) {
        logger('error', '[Adapter] Plan item object is null/undefined');
        return "";
    }

    let value = '';
    if (path === "membership.name") {
        value = importedMemberships.find(m => m.newId === obj.planId)?.name || ' ';
        logger('debug', `[Adapter] Mapped membership.name to planId: ${value}`);
    } else if (path === "membership.amount") {
        value = obj.payment?.amount ? String(obj.payment?.amount) : ' ';
        logger('debug', `[Adapter] Mapped membership.amount to payment.amount: ${value}`);
    } else if (path === "membership.status") {
        value = String(obj.status).toLowerCase();
        logger('debug', `[Adapter] Mapped membership.status to status: ${value}`);
    } else {
        logger('error', `[Adapter] Unknown property path: ${path}`);
    }

    return value;
}

function formatSignupDate(memberData: v2CurrentMember): string {
    logger('debug', '[Adapter] Formatting signup date');

    if (!memberData.createdAt) {
        logger('warn', '[Adapter] No signup date found in member data');
        return '';
    }
    try {
        const date = new Date(memberData.createdAt);

        if (isNaN(date.getTime())) {
            logger('error', `[Adapter] Invalid signup date: ${memberData.createdAt}`);
            return '';
        }

        const formatted = new Intl.DateTimeFormat("en-US").format(date)

        logger('debug', `[Adapter] Formatted signup date: ${formatted}`);
        return formatted;
    } catch (error) {
        logger('error', `[Adapter] Error formatting signup date: ${error}`);
        return '';
    }
}

export function replaceMembershipAttribute(el: HTMLElement, propertyPath: string, memberData: v2CurrentMember, importedMemberships: MembershipsMap[]): boolean {
    logger('trace', `[Adapter] Replacing membership attribute for property: ${propertyPath}`);

    if (!propertyPath.startsWith('membership.')) {
        logger('debug', `[Adapter] Skipping non-membership property: ${propertyPath}`);
        return false;
    }

    if (!memberData.planConnections || memberData.planConnections.length === 0) {
        logger('error', '[Adapter] No plan connections found in member data');
        return false;
    }

    const value = getNestedProperty(memberData.planConnections[0], propertyPath, importedMemberships);

    if (value) {
        el.textContent = value;
        logger('debug', `[Adapter] Set membership property "${propertyPath}" to "${value}" on ${el.tagName} element`);
        return true;
    } else {
        logger('debug', `[Adapter] Empty value for membership property "${propertyPath}" - element content not updated`);
        return false;
    }
}

export function replaceSignupDateAttribute(el: HTMLElement, memberData: v2CurrentMember): boolean {
    logger('trace', '[Adapter] Replacing signup date attribute');

    const formattedDate = formatSignupDate(memberData);

    if (formattedDate) {
        el.textContent = formattedDate;
        logger('debug', `[Adapter] Set signup date to "${formattedDate}" on ${el.tagName} element`);
        return true;
    } else {
        logger('debug', '[Adapter] Could not format signup date - element content not updated');
        return false;
    }
}

export function updateAllMemberAttributes(importedMemberships: MembershipsMap[]): number {
    logger('trace', '[Adapter] Starting member attributes update process');

    if (!isMemberAuthV2()) {
        logger('debug', '[Adapter] Member not authenticated with v2, skipping member attributes update');
        return 0;
    }

    const memberData = getCurrentMemberV2();
    if (!memberData) {
        logger('error', '[Adapter] Failed to fetch member data');
        return 0;
    }

    logger('debug', `[Adapter] Retrieved member data for member ID: ${memberData.id}`);

    let updatedCount = 0;

    // Handle membership-related data-ms-member attributes
    const membershipElements = document.querySelectorAll("[data-ms-member^='membership.']");
    if(membershipElements.length) {
        logger('warn', `[Adapter] Found ${membershipElements.length} elements with membership-related data-ms-member attributes`);

        membershipElements.forEach(el => {
            const propertyPath = el.getAttribute("data-ms-member");
            if (propertyPath) {
                const success = replaceMembershipAttribute(el as HTMLElement, propertyPath, memberData, importedMemberships);
                if (success) updatedCount++;
            }
        });
    }

    // Handle signup-date.DateTimeFormat() attributes
    const signupDateElements = document.querySelectorAll("[data-ms-member='signup-date.DateTimeFormat()']");
    if(signupDateElements.length) {
        logger('warn', `[Adapter] Found ${signupDateElements.length} elements with signup-date.DateTimeFormat() attributes`);

        signupDateElements.forEach(el => {
            const success = replaceSignupDateAttribute(el as HTMLElement, memberData);
            if (success) updatedCount++;
        });
    }

    logger('info', `[Adapter] Member attributes update completed. Processed ${updatedCount} elements`);
    return updatedCount;
}