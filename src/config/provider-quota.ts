export interface ProviderQuota {
  maxRequests: number;
  windowSeconds: number;
}

export const providerQuotas: Record<
  string,
  ProviderQuota
> = {
  smtp: {
    maxRequests: 5,
    windowSeconds: 10,
  },

  sendgrid: {
    maxRequests: 10,
    windowSeconds: 10,
  },
};