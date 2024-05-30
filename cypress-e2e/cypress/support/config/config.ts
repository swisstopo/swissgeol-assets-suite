interface Config {
  assetsBaseUrl: string;
  basic_auth_username: string;
  basic_auth_password: string;
}
export const {assetsBaseUrl, basic_auth_username, basic_auth_password}: Config = Cypress.env() as Config;
