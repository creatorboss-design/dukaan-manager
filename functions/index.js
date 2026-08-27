const { onCall, HttpsError } = require("firebase-functions/v2/https");
const cloudinary = require("cloudinary").v2;

// Credentials are stored as Firebase secrets, never in source code.
// Set them once with:
//   firebase functions:secrets:set CLOUDINARY_API_KEY
//   firebase functions:secrets:set CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: "hxqxp0xx",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Returns a short-lived Cloudinary signed-upload token.
 * Requires the caller to be authenticated via Firebase Auth — unauthenticated
 * callers (including external scripts) receive an "unauthenticated" error and
 * cannot upload to this Cloudinary account.
 */
exports.getCloudinarySignature = onCall(
  {
    // Declare the secrets this function needs at runtime
    secrets: ["CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
  },
  (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to upload.");
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      timestamp,
      folder: "invoices",
      upload_preset: "invoices_unsigned",
    };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: "invoices",
    };
  }
);
