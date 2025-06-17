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

export function updateAllPlanAttributes(importedMemberships: Record<string, string>) {
    document.querySelectorAll("[data-ms-plan]").forEach(el => {
        const oldId = el.getAttribute("data-ms-plan");
        if (oldId) {
            replacePlanAttribute(el as HTMLElement, oldId, importedMemberships);
        }
    });
}