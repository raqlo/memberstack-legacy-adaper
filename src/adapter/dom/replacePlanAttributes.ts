/**
 * @fileoverview Main orchestrator for all plan attribute transformations and URL handling.
 * Coordinates the processing of data-ms-plan, data-ms-membership, hash URLs, and page URLs.
 *
 * @example
 * // Usage: updateAllPlanAttributes({'mem_old123': 'pln_new456'})
 * // Processes all elements on page and transforms them according to mapping
 *
 * @example
 * // Processes: data-ms-plan, data-ms-membership, #/ms/signup/, #/ms/login, page URLs
 * // Result: All elements transformed to v2 format with proper logging
 */


import {logger} from "@utils/logger";
import {processDataMsPlanAttributes, processDataMsMembershipAttributes} from "./planAttributeHelpers";
import {processHashSignupUrls, processHashLoginUrls} from "./hashUrlToModalTransformator";
import {handleSignupPageUrls} from "./pageUrlHandlers";

export function updateAllPlanAttributes(importedMemberships: Record<string, string>) {
    logger('trace', '[Adapter] Starting plan attributes update process');

    const membershipCount = Object.keys(importedMemberships).length;
    logger('warn', `[Adapter] Working with ${membershipCount} imported memberships`);

    // Process different types of elements
    const planCount = processDataMsPlanAttributes(importedMemberships);
    const membershipCount_processed = processDataMsMembershipAttributes(importedMemberships);
    const hashSignupCount = processHashSignupUrls(importedMemberships);
    const hashLoginCount = processHashLoginUrls();
    const pageUrlCount = handleSignupPageUrls();

    const totalProcessed = planCount + membershipCount_processed + hashSignupCount + hashLoginCount;
    logger('info', `[Adapter] Plan attributes update completed. Processed ${totalProcessed} elements total (${pageUrlCount} page URLs logged)`);
}