import type {v2PlanItem} from "../types/v2-entities";
import type {v1PlanItem} from "../types/v1-entities";

// @ts-ignore
export function adaptMemberObject(v2Member) {
    return {
        id: v2Member.id,
        email: v2Member.email,
        customFields: v2Member.data, // v1 used "customFields", v2 uses "data"
    };
}

export function adaptPlanObject(v2Plan: v2PlanItem): v1PlanItem {
    return {
        amount: v2Plan.type === "FREE" ? '' : v2Plan.payment!.amount!,
        cancel_at_period_end: !!(v2Plan.payment?.cancelAtDate),
        id: v2Plan.planId,
        name: v2Plan.planId, // doesn't exist in v1,
        signupDate: v2Plan.planId, // doesn't exist in v1'
    // @ts-ignore
        status: v2Plan.status
    };
}