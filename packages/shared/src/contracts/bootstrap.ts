export type PublicAuthProviders = {
  google: boolean;
  magicLink: boolean;
};

export type PublicBootstrap = {
  productName: string;
  tagline: string;
  features: string[];
  authProviders: PublicAuthProviders;
};
