export interface ProviderQuota {
  maxRequests: number;
  windowSeconds: number;
}

export const providerQuotas: Record<
  string,
  ProviderQuota
> = {
  mock: {
    maxRequests: 1000,
    windowSeconds: 10,
  },

  smtp: {
    maxRequests: 5,
    windowSeconds: 10,
  },

  sendgrid: {
    maxRequests: 10,
    windowSeconds: 10,
  },
};