export interface AppConfig {
  mode: AppMode;
  googleAnalyticsId: string | null;
  oauth: OAuthConfig;
}

export enum AppMode {
  Default = 'Default',
  Anonymous = 'Anonymous',
}

export interface OAuthConfig {
  issuer: string;
  clientId: string;
  scope: string;
  showDebugInformation: boolean;
  tokenEndpoint: string;
}
