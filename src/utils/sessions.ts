import type {GetCurrentMemberPayload} from "@memberstack/dom";

const V1_SESSION_NAME = '__ms';
const V1_STRIPE_MID = '__stripe_mid'
const V1_STRIPE_SESSION_ID = "__stripe_sid"

const V2_SESSION_ID = '_ms-mid';
const V2_SESSION_MEMBER = '_ms-mem';

export function deleteV1Session() {
    document.cookie = `${V1_SESSION_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${V1_STRIPE_MID}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${V1_STRIPE_SESSION_ID}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    localStorage.removeItem('memberstack');
}

export function isMemberAuthV2() {
    return localStorage.getItem(V2_SESSION_ID) !== null;
}

export function getCurrentMemberV2() {
    if(!isMemberAuthV2()) {
        return null
    }
    return JSON.parse(localStorage.getItem(V2_SESSION_MEMBER)!) as GetCurrentMemberPayload['data']
}