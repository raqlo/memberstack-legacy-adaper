export function adaptMemberObject(v2Member) {
    return {
        id: v2Member.id,
        email: v2Member.email,
        customFields: v2Member.data, // v1 used "customFields", v2 uses "data"
    };
}
