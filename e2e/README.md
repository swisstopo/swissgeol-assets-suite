# AssetsCypressE2eTests

This project contains cypress tests that are executed against dev environment (http://localhost:4200/).

## Project structure

The project structure adheres to the best practice guide for [cypress.io](https://www.cypress.io) and the
proposed folder structure/organization as mentioned on this
page [Organizing Tests](https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests).

## Running tests

To start the tests locally please follow the steps below:

install dependencies

```bash
npm install
```

Add or change  user credentials in cypress.config.ts

to run cypress in terminal:

```bash
cypress run --browser [browser of your choice e.g. firefox]
```

or if you prefer to use the cypress gui:

```bash
cypress open
```
