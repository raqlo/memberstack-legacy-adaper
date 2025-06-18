
import {logger} from "@utils/logger";
import {getCurrentMemberV2, isMemberAuthV2} from "@utils/sessions";
import type {v2CurrentMember, v2PlanItem} from "@/types/v2-entities";


export function getPlanAttribute(id: string): string | null {
    logger('debug', `[Adapter] Getting plan attribute for ID: ${id}`);

    if (id.startsWith("prc_")) {
        logger('debug', `[Adapter] ID "${id}" is a price ID, returning data-ms-plan:price`);
        return "data-ms-plan:price";
    }
    if (id.startsWith("pln_")) {
        logger('debug', `[Adapter] ID "${id}" is a plan ID, returning data-ms-plan:add`);
        return "data-ms-plan:add";
    }

    logger('error', `[Adapter] Unknown ID format: "${id}" - expected prc_ or pln_ prefix`);
    return null;
}

export function replacePlanAttribute(
    el: HTMLElement,
    oldId: string,
    importedMemberships: Record<string, string>
) {
    logger('debug', `[Adapter] Replacing plan attribute for old ID: ${oldId}`);

    const newId = importedMemberships[oldId];
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

export function replaceMembershipAttribute(
    el: HTMLElement,
    oldId: string,
    importedMemberships: Record<string, string>
) {
    logger('debug', `[Adapter] Replacing membership attribute for old ID: ${oldId}`);

    const newId = importedMemberships[oldId];
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

    logger('debug', `[Adapter] Successfully replaced membership attribute: ${oldId} -> ${newId} (${attr})`);
}

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

export function updateAllPlanAttributes(importedMemberships: Record<string, string>) {
    logger('trace', '[Adapter] Starting plan attributes update process');

    const membershipCount = Object.keys(importedMemberships).length;
    logger('warn', `[Adapter] Working with ${membershipCount} imported memberships`);

    // Handle data-ms-plan attributes
    const planElements = document.querySelectorAll("[data-ms-plan]");
    if (planElements.length) {

    logger('warn', `[Adapter] Found ${planElements.length} elements with data-ms-plan attribute`);
    planElements.forEach(el => {
        const oldId = el.getAttribute("data-ms-plan");
        if (oldId) {
            replacePlanAttribute(el as HTMLElement, oldId, importedMemberships);
        }
    });
    }


    // Handle data-ms-membership attributes (convert to data-ms-plan format)
    const membershipElements = document.querySelectorAll("[data-ms-membership]");
   if(membershipElements.length) {
       logger('warn', `[Adapter] Found ${membershipElements.length} elements with data-ms-membership attribute`);

       membershipElements.forEach(el => {
           const oldId = el.getAttribute("data-ms-membership");
           if (oldId) {
               replaceMembershipAttribute(el as HTMLElement, oldId, importedMemberships);
           }
       });
   }

    // Handle signup href attributes
    const signupElements = document.querySelectorAll('a[href^="#/ms/signup/"]');
    if(signupElements.length > 0) {
        logger('warn', `[Adapter] Found ${signupElements.length} elements with signup href attributes`);

        signupElements.forEach(el => {
            const href = el.getAttribute("href");
            if (href) {
                // Extract the ID from the href (everything after the last slash)
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

    const totalProcessed = planElements.length + membershipElements.length + signupElements.length;
    logger('info', `[Adapter] Plan attributes update completed. Processed ${totalProcessed} elements total`);
}

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

export function replaceMemberAttribute(el: HTMLElement, propertyPath: string, memberData: v2CurrentMember) {
    logger('trace', `[Adapter] Replacing member attribute for property: ${propertyPath}`);

    // Only handle membership-related attributes
    if (!propertyPath.startsWith('membership.')) {
        logger('debug', `[Adapter] Skipping non-membership property: ${propertyPath}`);
        return; // Let Memberstack handle non-membership attributes
    }

    if (!memberData.planConnections || memberData.planConnections.length === 0) {
        logger('error', '[Adapter] No plan connections found in member data');
        return;
    }

    const value = getNestedProperty(memberData.planConnections[0], propertyPath);

    if (value) {
        el.textContent = value;
        logger('debug', `[Adapter] Set member property "${propertyPath}" to "${value}" on ${el.tagName} element`);
    } else {
        logger('debug', `[Adapter] Empty value for member property "${propertyPath}" - element content not updated`);
    }
}

export function updateAllMemberAttributes() {
    logger('trace', '[Adapter] Starting member attributes update process');

    if (!isMemberAuthV2()) {
        logger('debug', '[Adapter] Member not authenticated with v2, skipping member attributes update');
        return;
    }

    const memberData = getCurrentMemberV2();
    if (!memberData) {
        logger('error', '[Adapter] Failed to fetch member data');
        return;
    }

    logger('debug', `[Adapter] Retrieved member data for member ID: ${memberData.id}`);

    // Handle only membership-related data-ms-member attributes
    const memberElements = document.querySelectorAll("[data-ms-member^='membership.']");
    logger('warn', `[Adapter] Found ${memberElements.length} elements with membership-related data-ms-member attributes`);

    memberElements.forEach(el => {
        const propertyPath = el.getAttribute("data-ms-member");
        if (propertyPath) {
            replaceMemberAttribute(el as HTMLElement, propertyPath, memberData);
        }
    });

    logger('info', `[Adapter] Member attributes update completed. Processed ${memberElements.length} elements`);
}