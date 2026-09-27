const CLOUD_NAME = "hxqxp0xx";
const UPLOAD_PRESET = "invoices_unsigned";

/**
 * Uploads a Blob to Cloudinary using an unsigned upload preset.
 *
 * NOTE: This is intentionally NOT using a signed/Cloud-Function-backed
 * upload flow. That approach requires the Firebase Blaze (pay-as-you-go)
 * plan, which this project deliberately avoids to stay on the free Spark
 * plan with no billing card on file. Risk is instead mitigated by:
 *   1. Restricting the "invoices_unsigned" preset in the Cloudinary
 *      dashboard (allowed formats, max file size, fixed folder) — see
 *      Round 5 Item 2 of the fix spec.
 *   2. Cloudinary's free plan does not bill overages; abuse results in a
 *      soft account pause with warnings, not a surprise charge.
 * If this app later needs to scale onto Firebase Blaze anyway (e.g. for
 * other features), revisit and switch back to the signed-upload flow from
 * Round 3 (functions/index.js + getCloudinarySignature) for full security.
 *
 * @param {Blob} blob  - The file blob to upload (e.g. a PDF).
 * @param {string} filename - Filename hint (e.g. "invoice_TKN12345.pdf").
 * @returns {Promise<string>} - Resolves to the secure_url of the uploaded file.
 */
export async function uploadToCloudinary(blob, filename) {
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "invoices");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.secure_url;
}
