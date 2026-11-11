import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marks a request as loading the resource that the current page is built around.
 * If such a request fails with a 404, the user is redirected to the given page and notified.
 * The value is a path without language prefix, e.g. `/admin/users`, or an empty string for the start page.
 */
export const REDIRECT_ON_NOT_FOUND = new HttpContextToken<string | null>(() => null);

export const redirectOnNotFound = (path: string): HttpContext => new HttpContext().set(REDIRECT_ON_NOT_FOUND, path);
