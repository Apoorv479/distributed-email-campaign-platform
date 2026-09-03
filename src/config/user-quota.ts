export interface UserQuota {
  maxRequests: number;
  windowSeconds: number;
}

export const defaultUserQuota: UserQuota = {
  maxRequests: 3,
  windowSeconds: 10,
};