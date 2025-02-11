interface Config {
  basicAuthUsername: string;
  basicAuthPassword: string;
}
export const { basicAuthUsername, basicAuthPassword }: Config =
  Cypress.env() as Config;
