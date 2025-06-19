/**
 * @fileoverview Handles data-ms-member attributes for displaying member-specific data.
 * Populates elements with member information like plan names, amounts, and status.
 *
 * @example
 * // Before: <span data-ms-member="membership.name">Loading...</span>
 * // After:  <span data-ms-member="membership.name">Premium Plan</span>
 *
 * @example
 * // Before: <div data-ms-member="membership.amount">$0</div>
 * // After:  <div data-ms-member="membership.amount">$29.99</div>
 */

import {logger} from "@utils/logger";
import {getCurrentMemberV2, isMemberAuthV2} from "@utils/sessions";
import type {v2CurrentMember, v2PlanItem} from "@/types/v2-entities";

function getNestedProperty(obj: v2PlanItem, path: string): string {
    logger('debug', `[Adapter] Getting nested property "${path}" from plan item`);

    if (!obj) {
        logger('error', '[Adapter] Plan item object is null/undefined');
        return "";
    }

    let value = '';
    if (path === "membership.name") {
        value = obj.planId; // name doesn't exist in v2
        logger('debug', `[Adapter] Mapped membership.name to planId: ${value}`);
    } else if (path === "membership.amount") {
        value = String(obj.payment?.amount) || '0';
        logger('debug', `[Adapter] Mapped membership.amount to payment.amount: ${value}`);
    } else if (path === "membership.status") {
        value = obj.status;
        logger('debug', `[Adapter] Mapped membership.status to status: ${value}`);
    } else {
        logger('error', `[Adapter] Unknown property path: ${path}`);
    }

    return value;
}

export function replaceMemberAttribute(el: HTMLElement, propertyPath: string, memberData: v2CurrentMember): boolean {
    logger('trace', `[Adapter] Replacing member attribute for property: ${propertyPath}`);

    // Only handle membership-related attributes
    if (!propertyPath.startsWith('membership.')) {
        logger('debug', `[Adapter] Skipping non-membership property: ${propertyPath}`);
        return false; // Let Memberstack handle non-membership attributes
    }

    if (!memberData.planConnections || memberData.planConnections.length === 0) {
        logger('error', '[Adapter] No plan connections found in member data');
        return false;
    }

    const value = getNestedProperty(memberData.planConnections[0], propertyPath);

    if (value) {
        el.textContent = value;
        logger('debug', `[Adapter] Set member property "${propertyPath}" to "${value}" on ${el.tagName} element`);
        return true;
    } else {
        logger('debug', `[Adapter] Empty value for member property "${propertyPath}" - element content not updated`);
        return false;
    }
}

export function updateAllMemberAttributes(): number {
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

    // Handle only membership-related data-ms-member attributes
    const memberElements = document.querySelectorAll("[data-ms-member^='membership.']");
    logger('warn', `[Adapter] Found ${memberElements.length} elements with membership-related data-ms-member attributes`);

    let updatedCount = 0;
    memberElements.forEach(el => {
        const propertyPath = el.getAttribute("data-ms-member");
        if (propertyPath) {
            const success = replaceMemberAttribute(el as HTMLElement, propertyPath, memberData);
            if (success) updatedCount++;
        }
    });

    logger('info', `[Adapter] Member attributes update completed. Processed ${updatedCount} elements`);
    return updatedCount;
}