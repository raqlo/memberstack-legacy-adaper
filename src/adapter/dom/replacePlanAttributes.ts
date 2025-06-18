import {logger} from "@utils/logger";
import {getCurrentMemberV2, isMemberAuthV2} from "@utils/sessions";
import type {v2CurrentMember, v2PlanItem} from "@/types/v2-entities";


export function getPlanAttribute(id: string): string | null {
    if (id.startsWith("prc_")) return "data-ms-plan:price";
    if (id.startsWith("pln_")) return "data-ms-plan:add";
    return null;
}

export function replacePlanAttribute(
    el: HTMLElement,
    oldId: string,
    importedMemberships: Record<string, string>
) {
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
}

export function replaceMembershipAttribute(
    el: HTMLElement,
    oldId: string,
    importedMemberships: Record<string, string>
) {
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
}

export function replaceSignupHref(
    el: HTMLElement,
    extractedId: string,
    importedMemberships: Record<string, string>
) {
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

    logger('trace', `[Adapter] Replaced signup href with modal for ID "${extractedId}" -> "${newId}"`);
}

export function updateAllPlanAttributes(importedMemberships: Record<string, string>) {
    // Handle data-ms-plan attributes
    document.querySelectorAll("[data-ms-plan]").forEach(el => {
        const oldId = el.getAttribute("data-ms-plan");
        if (oldId) {
            replacePlanAttribute(el as HTMLElement, oldId, importedMemberships);
        }
        logger('trace', `[Adapter] Replaced plan attribute "${oldId}" with "${el.getAttribute("data-ms-plan")}" on element "${el.outerHTML}"`)
    });

    // Handle data-ms-membership attributes (convert to data-ms-plan format)
    document.querySelectorAll("[data-ms-membership]").forEach(el => {
        const oldId = el.getAttribute("data-ms-membership");
        if (oldId) {
            replaceMembershipAttribute(el as HTMLElement, oldId, importedMemberships);
        }
    });

    // Handle signup href attributes
    document.querySelectorAll('a[href^="#/ms/signup/"]').forEach(el => {
        const href = el.getAttribute("href");
        if (href) {
            // Extract the ID from the href (everything after the last slash)
            const match = href.match(/#\/ms\/signup\/(.+)$/);
            if (match && match[1]) {
                const extractedId = match[1];
                replaceSignupHref(el as HTMLElement, extractedId, importedMemberships);
            }
        }
    });
}

function getNestedProperty(obj: v2PlanItem, path: string): string {
    if (!obj) {
        return "";
    }
    debugger;
    if (path === "membership.name") return obj.planId // name doesn't exist in v2
    if (path === "membership.amount") return String(obj.payment?.amount) || '0'
    if (path === "membership.status") return obj.status
    return ''
}

export function replaceMemberAttribute(el: HTMLElement, propertyPath: string, memberData: v2CurrentMember) {
    // Only handle membership-related attributes
    if (!propertyPath.startsWith('membership.')) {
        return; // Let Memberstack handle non-membership attributes
    }

    const value = getNestedProperty(memberData.planConnections[0], propertyPath);
    debugger;
    if (value) {
        el.textContent = value;
        logger('trace', `[Adapter] Set member property "${propertyPath}" to "${value}" on element`);
    } else {
        logger('warn', `[Adapter] Empty value for member property "${propertyPath}"`);
    }
}


export function updateAllMemberAttributes() {
    if (!isMemberAuthV2()) {
        return;
    }
    const memberData = getCurrentMemberV2()
    if (!memberData) {
        logger('error', '[Adapter] Failed to fetch member data');
        return;
    }

    // Handle only membership-related data-ms-member attributes
    document.querySelectorAll("[data-ms-member^='membership.']").forEach(el => {
        const propertyPath = el.getAttribute("data-ms-member");
        if (propertyPath) {
            replaceMemberAttribute(el as HTMLElement, propertyPath, memberData);
        }
    });
}

