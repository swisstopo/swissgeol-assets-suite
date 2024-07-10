# Shared2

This is the new `shared` module, containing code shared between the client and the server.
It is an alternative to the local libraries like `lib/shared`, `lib/core` and others,
but unlike them, it's just a collection of source files, without any associated build steps.

Members of this module can be imported via the `@shared/*` path alias.

> If we ever manage to fully replace everything in the directory `lib/shared`, we can rename this directory to `shared`.
> As long as `lib/shared` remains, however, so will `lib/shared2`.

## Module Structure

### `@shared/models`

The application's models, as sent by the API.

### `@shared/policies`

Policies that can be used to check the permissions of a specific user for a specific resource.

### `@shared/schemas`

Mapping types that can be used to (de)normalize and validate models.

### `@shared/utils`

Various utilities.
