export type v1PlanItem = {
    amount: string | number,
    cancel_at_period_end: boolean;
    id: string;
    name: string;
    signupDate: string;
    status: "active" | "canceled" | "expired" | "pending" | "trialing" | "unknown" // ToDo check v1 status
}

export type onReadyPayload = {
    email: string;
    getMetaData: () => any;
    loggedIn: boolean
    memberPage: any
    membership: v1PlanItem | null
    updateMetaData: () => any
    updateProfile: () => any
}