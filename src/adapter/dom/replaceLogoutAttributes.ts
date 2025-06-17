
export function replaceLogoutAttribute(el: HTMLElement) {
    // Remove old attributes and set new one
    el.removeAttribute("data-ms-logout");
    el.removeAttribute("ms-logout");
    el.setAttribute("data-ms-action", "logout");
}

export function updateAllLogoutAttributes() {
    // Handle data-ms-logout attributes
    document.querySelectorAll("[data-ms-logout]").forEach(el => {
        replaceLogoutAttribute(el as HTMLElement);
    });

    // Handle ms-logout attributes (without data- prefix)
    document.querySelectorAll("[ms-logout]").forEach(el => {
        replaceLogoutAttribute(el as HTMLElement);
    });
}