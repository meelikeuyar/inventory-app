/**
 * Pick only allowed fields from an object.
 * Prevents prototype pollution and mass-assignment attacks.
 */
export function pickFields<T extends Record<string, unknown>>(
  obj: T,
  allowedFields: readonly string[],
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in obj && obj[field] !== undefined) {
      result[field] = obj[field];
    }
  }
  return result as Partial<T>;
}
