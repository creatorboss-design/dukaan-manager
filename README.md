# Dukaan Manager — Mobile Repair Shop App

A full-featured PWA (Progressive Web App) for managing a mobile repair shop.
Installable on any device (Android/iOS/Windows/Mac), works offline, free Firebase backend.

## Quick Start (Run Locally)

```bash
npm install
npm run dev
```
Open http://localhost:5173

## First Time Setup — How to Become Owner

> ⚠️ **IMPORTANT:** The public sign-up form now always creates **Staff** accounts. There is no longer a role dropdown. To become Owner, follow these steps once:

1. Register normally through the app (creates a Staff account)
2. Go to [Firebase Console](https://console.firebase.google.com) → your project → **Firestore Database** → `users` collection
3. Find the document whose ID matches your Firebase Auth UID (visible in Authentication → Users)
4. Edit the `role` field: change `"staff"` → `"owner"`
5. Save — you are now Owner. Refresh the app.

This is a one-time manual step. Only existing Owners can grant Owner access to others (also done via Firestore Console).

## Features Built

| Module | What it does |
|--------|-------------|
| A - Repairs | Track jobs, status pipeline, token numbers, PDF invoices, repeat-issue detector |
| B - Inventory | Accessories + spare parts, auto-deduct on sale, low stock alerts, barcode scanner |
| C - Phones | IMEI tracking, buy/sell ledger, exchange calculator |
| D - Cash Book | Income/expense, udhaar khata (credit tracker), supplier tracker |
| E - Customers | Auto-built from repairs, full repair history per customer |
| F - Warranty | Auto-tracked per repair, valid/expired status |
| G - Roles | Owner sees profits, Staff sees operational data only (enforced server-side via Firestore Rules) |
| H - Offline | Works without internet, syncs on reconnect |
| I - Export | One-click CSV export of all records |
| J - Analytics | Top issues, best-selling items, busiest days — on Dashboard |
| K - Invoices | PDF invoices with shop name, GST |
| L - Multi-Branch | Branch field ready for expansion |
| M - Notifications | WhatsApp "Notify" button on Ready repairs — opens pre-filled wa.me link |

## Deploy to Firebase Hosting (Make it Live Forever)

```bash
npm install -g firebase-tools
firebase login
npm run build
firebase deploy
```
Your app will be live at: https://dukaan-manager-6c75b.web.app

### Deploy Security Rules Only

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## Install on Phone

**Android:** Open the app URL in Chrome → Menu (⋮) → "Add to Home Screen"  
**iPhone:** Open in Safari → Share button → "Add to Home Screen"

## Security Model

### Firestore Rules (firestore.rules)
- **Any user** can self-register, but always gets `role: "staff"` — no public Owner signup
- **Staff** can read/write: repairs, inventory, phones, customers, inventory_sales
- **Staff** can *create* cashbook entries (logging sales) but cannot *read* or *modify* the cashbook
- **Owner only**: full cashbook, credit_tracker, suppliers, and promoting other users' roles
- Rules are deployed via `firebase deploy --only firestore:rules`

### Storage Rules (storage.rules)
- Any authenticated user can read/write (uploads like invoices, photos)

### Role Promotion
Only via Firebase Console directly. The app UI never allows self-promotion to Owner.

## WhatsApp Notifications

When a repair's status is set to **Ready**, a green **💬 Notify** button appears on the repair card.

- Tapping it opens WhatsApp with a pre-filled message to the customer's phone number
- The message includes the customer name, device model, and shop name
- **This requires staff to tap "Send" manually in WhatsApp** — it is not automatic
- Phone numbers are assumed to be Indian (+91) if they are 10 digits. For international customers, enter the full number including country code (e.g., 919876543210)

> **Future upgrade:** Automatic server-side notifications can be added via Firebase Cloud Functions + WhatsApp Cloud API, but requires the Firebase **Blaze** (pay-as-you-go) plan. The manual wa.me approach ships now at zero cost.

## Barcode / QR Scanning

The Inventory screen has two scan entry points:
1. **📷 Scan button** next to the Barcode/SKU field — scans when adding/editing an item
2. **📷 icon button** in the main search bar — "Scan to Sell": scans a barcode, finds the matching item, and immediately opens the sell form

> Camera access requires HTTPS. Works on Firebase Hosting automatically. Will not work on plain `http://localhost` on mobile.

## Analytics Dashboard

The Dashboard now shows three analytics cards:
- **Top Issues** — most common repair problem types
- **🏆 Best-Selling Items** — top 5 accessory/spare part sales by quantity from `inventory_sales`
- **📅 Busiest Days** — days of the week ranked by number of repair jobs

## Project Structure

```
src/
  firebase/config.js     Firebase config
  contexts/              Auth + App state
  pages/                 All screens
  components/            Reusable UI
    inventory/           BarcodeScanner component
  utils/                 PDF, CSV, translations
public/
  manifest.json          PWA install config
  sw.js                  Offline service worker
  icon-192.png           PWA icon (192x192)
  icon-512.png           PWA icon (512x512)
firestore.rules          Firestore security rules
storage.rules            Firebase Storage security rules
firestore.indexes.json   Firestore composite indexes
```
