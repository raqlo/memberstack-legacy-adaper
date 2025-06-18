import type {GetCurrentMemberPayload} from "@memberstack/dom";

export type v2PlanItem = GetCurrentMemberPayload['data']['planConnections'][0];

export type v2CurrentMember = GetCurrentMemberPayload['data'];