/**
 * This adapts the 2.0 API ($memberstackDom) to look and behave like 1.0.
 * It handles data shape changes, promises normalization, etc.
 */
import type {MemberstackDom} from "../types/globals";


export default function wrapV2($dom: MemberstackDom) {
    return {
        onReady(callback: Function) {
            $dom.getCurrentMember().then(() => callback());
        },

        // async getMember() {
        //     const member = await $dom.getCurrentMember();
        //     return {
        //         id: member.data.id,
        //         email: member.data.id,
        //         // ... transform to match MS 1.0 shape if needed
        //     };
        // },
        //
        // logout() {
        //     return $dom.logout();
        // },

        // Add more adapters as needed
    };
}
