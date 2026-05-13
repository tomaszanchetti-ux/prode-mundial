export type UserPlan = "free" | "gold";

export const USER_PLANS = ["free", "gold"] as const satisfies ReadonlyArray<UserPlan>;
