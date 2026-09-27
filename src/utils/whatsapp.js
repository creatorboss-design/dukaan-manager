/**
 * Builds a wa.me deep link that opens WhatsApp with a prefilled message to a
 * given phone number. This requires no WhatsApp Business API, no paid
 * service, and no backend — it's a plain URL that opens the WhatsApp app (or
 * web.whatsapp.com) with the message pre-typed, ready for the shop owner or
 * staff member to review and hit send themselves. Nothing is sent
 * automatically; the human always taps "send" on their own device.
 *
 * @param {string} phone - Raw phone number as stored in Firestore, e.g. "9876543210" or "+91 98765 43210".
 * @param {string} message - The message to prefill. Will be URL-encoded automatically.
 * @returns {string|null} - A https://wa.me/... URL, or null if the phone number is unusable (empty or too short after cleanup).
 */
export function buildWhatsAppLink(phone, message) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 10) return null;
  // Assume India (+91) if exactly 10 digits with no country code already present.
  const e164 = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}
