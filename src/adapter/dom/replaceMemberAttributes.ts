import {logger} from "@utils/logger";
import {isMemberAuthV2} from "@utils/sessions";

export function updateRewriteAttributes() {
    logger('info', '[Adapter] Starting rewrite attributes update process');

    // Check if member is authenticated
    if (!isMemberAuthV2()) {
        logger('debug', '[Adapter] Member not authenticated, skipping rewrite attributes update');
        return;
    }

    // Find all elements with data-ms-rewrite attribute
    const rewriteElements = document.querySelectorAll("[data-ms-rewrite]");

    if (rewriteElements.length) {
        logger('warn', `[Adapter] Found ${rewriteElements.length} elements with data-ms-rewrite attribute`);

        rewriteElements.forEach(el => {
            const rewriteValue = el.getAttribute("data-ms-rewrite");
            if (rewriteValue) {
                // Replace the element's content with the rewrite value
                el.textContent = rewriteValue;
                logger('debug', `[Adapter] Updated element content to: "${rewriteValue}"`);
            } else {
                logger('debug', '[Adapter] Element has empty data-ms-rewrite attribute, skipping');
            }
        });

        logger('info', `[Adapter] Rewrite attributes update completed. Updated ${rewriteElements.length} elements`);
    } else {
        logger('debug', '[Adapter] No elements with data-ms-rewrite attribute found');
    }
}


export function updateLoginUrlsToProfile(loginUrl?: string) {
    if (!loginUrl) {
        logger('debug', '[Adapter] No login URL provided, skipping login URL to profile update');
        return;
    }

    logger('info', '[Adapter] Starting login URL to profile update process');

    // Check if member is authenticated
    if (!isMemberAuthV2()) {
        logger('debug', '[Adapter] Member not authenticated, skipping login URL updates');
        return;
    }

    // Find all elements with href matching the login URL
    const loginElements = document.querySelectorAll(`a[href="${loginUrl}"]`);

    if (loginElements.length) {
        logger('warn', `[Adapter] Found ${loginElements.length} elements with login URL that need profile URL update`);

        loginElements.forEach(el => {
            const linkElement = el as HTMLAnchorElement;
            linkElement.href = '/profile-page';
            logger('debug', `[Adapter] Updated login URL to profile URL for ${linkElement.tagName} element`);
        });

        logger('info', `[Adapter] Login URL to profile update completed. Updated ${loginElements.length} elements`);
    } else {
        logger('debug', `[Adapter] No elements with login URL "${loginUrl}" found`);
    }
}