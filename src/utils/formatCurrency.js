/**
 * Formats a number as Indian Rupees.
 * Examples: formatINR(15000) → "₹15,000"
 *           formatINR(0)     → "₹0"
 *           formatINR(NaN)   → "₹0"   (safe fallback, same as Number(NaN)||0)
 */
export function formatINR(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
