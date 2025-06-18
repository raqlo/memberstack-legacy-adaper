export function replaceLogoutAttribute(el: HTMLElement) {
    // Remove old attributes and set new one
    el.removeAttribute("data-ms-logout");
    el.removeAttribute("ms-logout");
    el.setAttribute("data-ms-action", "logout");
}

export function replaceForgotPasswordAttribute(el: HTMLElement) {
    el.removeAttribute("ms-forgot");
    el.setAttribute("data-ms-modal", "forgot-password");
}

export function replaceLoginAttribute(el: HTMLElement) {
    el.removeAttribute("ms-login");
    el.setAttribute("data-ms-modal", "login");
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

    // Handle ms-forgot attributes
    document.querySelectorAll("[ms-forgot]").forEach(el => {
        replaceForgotPasswordAttribute(el as HTMLElement);
    });

    // Handle ms-login attributes
    document.querySelectorAll("[ms-login]").forEach(el => {
        replaceLoginAttribute(el as HTMLElement);
    });
}