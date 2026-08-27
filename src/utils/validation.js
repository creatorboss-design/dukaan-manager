/**
 * Validates and coerces a form value into a non-negative finite number.
 * Throws a user-readable Error if invalid — callers should catch this
 * and show it via their existing error/toast mechanism.
 *
 * @param {*} value - raw form value (string or number)
 * @param {string} fieldName - human-readable name for the error message
 * @param {{ allowZero?: boolean }} [opts]
 * @returns {number}
 */
export function toPositiveNumber(value, fieldName, opts = {}) {
  const n = Number(value);
  if (value === "" || value === null || value === undefined || Number.isNaN(n)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  if (!Number.isFinite(n)) {
    throw new Error(`${fieldName} is too large.`);
  }
  if (n < 0) {
    throw new Error(`${fieldName} cannot be negative.`);
  }
  if (!opts.allowZero && n === 0) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }
  return n;
}
