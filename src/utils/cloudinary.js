const CLOUD_NAME = "hxqxp0xx";
const UPLOAD_PRESET = "invoices_unsigned";

/**
 * Uploads a Blob to Cloudinary using an unsigned upload preset.
 * @param {Blob} blob  - The file blob to upload (e.g. a PDF).
 * @param {string} filename - Filename hint (e.g. "invoice_TKN12345.pdf").
 * @returns {Promise<string>} - Resolves to the secure_url of the uploaded file.
 */
export async function uploadToCloudinary(blob, filename) {
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("upload_preset", UPLOAD_PRESET);

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
