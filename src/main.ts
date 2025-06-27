import {shouldUseAdapter} from './loader/detect-ms-version';
import {createLegacyProxy} from './adapter';
import {logger} from '@utils/logger';
import {config} from "./config";
import {deleteV1Session} from "@utils/sessions";
import {updateAllPlanAttributes} from "@dom/replacePlanAttributes";
import {updateAllLogoutAttributes} from "@dom/replaceUtilityAuthAttributes";
import {
    updateAllMemberUpdates
} from "@dom/replaceMemberAttributes";
import {processPasswordResetUrls} from "@dom/hashUrlToForgotPasswordModal";
import {processRelativeUrlWithHashUrls} from "@dom/relativeUrlWithHashToPlanAttribute";
import {processContentUrls} from "@dom/hashUrlToMsContentTransformator";
import {
    hideLoginModalOnAuth,
    hideProfileModalOnUnAuth
} from "@dom/hideElemsOnAuth";
import {transformMembershipRedirectLinks} from "@dom/hashUrlToMsActionTransformer";
import {executeMemberstackV1, executeMemberstackV2} from "@/vendor/memberstack";

function enableLegacyAdapter() {
    // exec before memberstack loads
    document.addEventListener('DOMContentLoaded', () => {
        updateAllPlanAttributes(config.adapter.importedMemberships);
        processRelativeUrlWithHashUrls(config.adapter.importedMemberships)
        updateAllLogoutAttributes();
        processPasswordResetUrls();
        processContentUrls()
        transformMembershipRedirectLinks()
    })
    logger('trace', '[Adapter] starting legacy adapter...')
    try {
        if (!window.$memberstackDom) {
            // loadScriptSync('https://static.memberstack.com/scripts/v1/memberstack.js', config);
            executeMemberstackV2(config)
        }

        const msDom = window.$memberstackDom;
        if (!msDom) {
            throw '[Adapter] Failed to load Memberstack 2.0'
        }

        window.MemberStack = createLegacyProxy(msDom);
        // exec after memberstack loads
        updateAllMemberUpdates({
            importMemberships: config.adapter.importedMemberships,
            loginUrl: config.adapter.loginUrl
        })
        hideProfileModalOnUnAuth()
        hideLoginModalOnAuth();
        logger('trace', '[Adapter] 2.0 adapter enabled and injected.');
    } catch (e) {
        if (e instanceof Error && e.message) {
            logger('error', `${e.message}`, e);
        } else {
            logger('error', `[Adapter] Unknown error: ${e}`);
        }
    }
}

/**
 * Grabs the existing MemberStack object if it exists — otherwise creates an empty one.
 * Replaces MemberStack.onReady with a custom Promise that doesn't resolve immediately.
 * This allows other scripts to call MemberStack.onReady() before v2 has loaded.
 * Once the data is ready, we resolve the promise manually via __resolveOnReady.
 */
function patchMemberStackOnReady() {
    if (!window.MemberStack) {
        let resolveOnReady: (val: any) => void;
        /** Create a Promise for MemberStack.onReady that doesn't resolve immediately.
         * Instead, we store its resolve function (resolveOnReady) so it can be manually
         * called later — once the Memberstack v2 data is ready. This allows us to mimic
         * the v1 behavior where scripts can rely on MemberStack.onReady even if v2 isn't ready yet.
         */
        const onReady = new Promise((resolve) => {
            resolveOnReady = resolve;
        });

        window.MemberStack = {
            onReady,
            __resolveOnReady: resolveOnReady!,
        };
    }
}


/**
 * Main entry point.
 */

(async function () {
    if (!config.adapter.enabled) {
        logger('start', '[Adapter] Adapter disabled.');
        return;
    }
    if (shouldUseAdapter(config) === 'v2') {
        logger('start', '[Adapter] V2 Adapter enabled.');
        deleteV1Session();
        patchMemberStackOnReady();
        enableLegacyAdapter();
    } else {
        logger('start', '[Adapter] Adapter not enabled — using v1.');
        // loadScriptSync('https://api.memberstack.io/static/memberstack.js?webflow', config);
        executeMemberstackV1(config)
    }
})()
