interface Config {
  assetsBaseUrl: string;
  basicAuthUsername: string;
  basicAuthPassword: string;
}
export const {assetsBaseUrl, basicAuthUsername, basicAuthPassword}: Config = Cypress.env() as Config;
