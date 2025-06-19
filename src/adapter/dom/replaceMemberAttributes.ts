/**
 * @fileoverview Main orchestrator for all member-specific DOM updates.
 * Coordinates rewrite attributes, URL updates, and member data population for authenticated users.
 *
 * @example
 * // Usage: updateAllMemberUpdates('/login')
 * // Processes all member-related DOM updates in one call
 *
 * @example
 * // Handles: data-ms-rewrite, login URL conversions, data-ms-member attributes
 * // Result: All member-specific elements updated based on authentication state
 */

import {logger} from "@utils/logger";
import {updateRewriteAttributes} from "./memberRewriteAttributes";
import {updateLoginUrlsToProfile} from "./memberUrlUpdates";
import {updateAllMemberAttributes} from "./memberDataAttributes";

export function updateAllMemberUpdates(loginUrl?: string) {
    logger('trace', '[Adapter] Starting all member updates process');

    const rewriteCount = updateRewriteAttributes();
    const urlCount = updateLoginUrlsToProfile(loginUrl);
    const memberDataCount = updateAllMemberAttributes();

    const totalUpdated = rewriteCount + urlCount + memberDataCount;
    logger('info', `[Adapter] All member updates completed. Updated ${totalUpdated} elements total`);
}