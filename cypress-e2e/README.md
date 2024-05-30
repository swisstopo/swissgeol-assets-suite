# AssetsCypressE2eTests

This project contains cypress tests that are executed against dev environment (http://localhost:4200/).

## Project structure

The project structure adheres to the best practice guide for [cypress.io](https://www.cypress.io) and the
proposed folder structure/organization as mentioned on this
page [Organizing Tests](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests).

## Running tests

To start the tests locally please follow the steps below:

1. Copy file cypress.env.json.example and rename to cypress.env.json
2. Add username and password env variables to cypress.env.json (copy from cypress.config.ts)
3. Add user credentials to cypress.env.json


`cypress run --browser [browser of your choice e.g. firefox]`

or if you prefer to use the cypress gui you can use `cypress open`.

## Further information

As stated in chapter "Running tests" you can override the values using the cypress.env.json file.
