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