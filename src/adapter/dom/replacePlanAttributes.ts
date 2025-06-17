import {logger} from "../../utils/logger";

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
    if (!newId) return;

    const attr = getPlanAttribute(newId);
    if (!attr) return;

    el.removeAttribute("data-ms-plan");
    el.setAttribute(attr, newId);
}

export function replaceMembershipAttribute(
    el: HTMLElement,
    oldId: string,
    importedMemberships: Record<string, string>
) {
    const newId = importedMemberships[oldId];
    if (!newId) return;

    // Use the same logic as plans - membership attributes become plan attributes
    const attr = getPlanAttribute(newId);
    if (!attr) return;

    el.removeAttribute("data-ms-membership");
    el.setAttribute(attr, newId);
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
}