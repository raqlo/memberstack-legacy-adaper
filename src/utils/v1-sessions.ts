const V1_SESSION_NAME = '__ms';
const V1_STRIPE_MID = '__stripe_mid'
const V1_STRIPE_SESSION_ID = "__stripe_sid"

export function deleteV1Session() {
    document.cookie = `${V1_SESSION_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${V1_STRIPE_MID}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${V1_STRIPE_SESSION_ID}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    localStorage.removeItem('memberstack');
}