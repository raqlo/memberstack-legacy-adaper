import type {
    GetMemberJSONPayload,
    UpdateMemberJSONParams,
    UpdateMemberParams,
    UpdateMemberPayload
} from "@memberstack/dom";

export type v1PlanItem = {
    amount: string | number,
    cancel_at_period_end: boolean;
    id: string;
    name: string;
    signupDate: string;
    status: "active" | "canceled" | "expired" | "pending" | "trialing" | "unknown" // ToDo check v1 status
}

// ToDo switch v2 return types to v1 return types (if applicable)
export type onReadyPayload = {
    email: string;
    getMetaData: () => Promise<v1GetMetaDataPayload>;
    loggedIn: boolean
    memberPage: any
    membership: v1PlanItem | null
    updateMetaData: (metadataParams: UpdateMemberJSONParams) => Promise<GetMemberJSONPayload> | undefined
    updateProfile: (customFields: UpdateMemberParams) => Promise<UpdateMemberPayload> | undefined
}

export type v1GetMemberPayload = {

}

export type v1GetMetaDataPayload = Record<string, string>