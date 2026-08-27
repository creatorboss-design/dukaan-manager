import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/config";

const CLOUD_NAME = "hxqxp0xx";
const functions = getFunctions(app);
const getSignature = httpsCallable(functions, "getCloudinarySignature");

/**
 * Uploads a Blob to Cloudinary using a signed request obtained from a
 * server-side Cloud Function. The function requires a valid Firebase Auth
 * token, so unauthenticated (or external) callers cannot obtain a valid
 * signature and cannot upload to this account.
 *
 * @param {Blob} blob  - The file blob to upload (e.g. a PDF).
 * @param {string} filename - Filename hint (e.g. "invoice_TKN12345.pdf").
 * @returns {Promise<string>} - Resolves to the secure_url of the uploaded file.
 */
export async function uploadToCloudinary(blob, filename) {
  // Get a short-lived signed request from the Cloud Function.
  // This call will throw if the user is not authenticated.
  const { data: sig } = await getSignature();

  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", sig.timestamp);
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);
  formData.append("upload_preset", "invoices_unsigned");

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
