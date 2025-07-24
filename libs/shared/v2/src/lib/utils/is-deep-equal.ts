/**
 *  Deep equality check for objects from https://medium.com/@stheodorejohn/javascript-object-deep-equality-comparison-in-javascript-7aa227e889d4.
 * @param obj1
 * @param obj2
 */
export function isDeepEqual(obj1: unknown, obj2: unknown): boolean {
  // Base case: If both objects are identical, return true.
  if (obj1 === obj2) {
    return true;
  }
  // Check if both objects are objects and not null.
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return isArrayDeepEqual(obj1, obj2);
    }
    return false;
  }
  // Get the keys of both objects.
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  // Check if the number of keys is the same.
  if (keys1.length !== keys2.length) {
    return false;
  }
  // Iterate through the keys and compare their values recursively.
  for (const key of keys1) {
    if (!keys2.includes(key) || !isDeepEqual(obj1[key as keyof object], obj2[key as keyof object])) {
      return false;
    }
  }
  // If all checks pass, the objects are deep equal.
  return true;
}

function isArrayDeepEqual<T>(a: T[] | null | undefined, b: T[] | null | undefined) {
  return !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);
}
