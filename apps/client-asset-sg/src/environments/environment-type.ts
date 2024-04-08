export interface CompileTimeEnvironment extends OAuthConfig {
    ngrxStoreLoggerEnabled: boolean;
}

interface OAuthConfig {
    oauth_issuer: string;
    oauth_clientId: string;
    oauth_scope: string;
    oauth_responseType: string;
    oauth_showDebugInformation: boolean;
    oauth_tokenEndpoint: string;
}
