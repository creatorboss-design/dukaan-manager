import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatINR } from "./formatCurrency";

const GST_RATE = 0.18; // Assumed 18% total (9% CGST + 9% SGST), intra-state only.

/**
 * Splits a tax-inclusive amount into its taxable value, CGST, and SGST
 * components, assuming intra-state supply at GST_RATE total.
 * @param {number} inclusiveAmount
 * @returns {{ taxable: number, cgst: number, sgst: number }}
 */
function splitGST(inclusiveAmount) {
  const taxable = inclusiveAmount / (1 + GST_RATE);
  const totalTax = inclusiveAmount - taxable;
  return { taxable: Math.round(taxable), cgst: Math.round(totalTax / 2), sgst: Math.round(totalTax / 2) };
}

export function generateInvoicePDF({ repair, shopSettings }) {
  const doc = new jsPDF();
  const { shopName = "My Repair Shop", gst = "" } = shopSettings || {};

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 64, 175);
  doc.text(shopName, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  if (gst) doc.text(`GST: ${gst}`, 14, 28);
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(gst ? "TAX INVOICE" : "REPAIR INVOICE", 140, 20);
  doc.setFontSize(10);
  doc.text(`Token: #${repair.tokenNo || repair.id?.slice(0, 6).toUpperCase()}`, 140, 28);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 140, 34);

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  // Customer info
  doc.setFontSize(11);
  doc.text("Customer Details", 14, 50);
  doc.setFontSize(10);
  doc.text(`Name: ${repair.customerName || ""}`, 14, 58);
  doc.text(`Phone: ${repair.phone || ""}`, 14, 64);
  doc.text(`Device: ${repair.deviceModel || ""}`, 14, 70);
  doc.text(`Issue: ${repair.issue || ""}`, 14, 76);

  // Cost table — shows a GST breakdown only if the shop has a GST number set.
  const totalAmount = repair.finalCost || repair.estimatedCost || 0;
  const gstBody = gst
    ? (() => {
        const { taxable, cgst, sgst } = splitGST(totalAmount);
        return [
          ["Taxable Value", formatINR(taxable)],
          ["CGST (9%)", formatINR(cgst)],
          ["SGST (9%)", formatINR(sgst)],
          ["Total (incl. GST)", formatINR(totalAmount)],
          ["Advance Paid", formatINR(repair.advancePaid || 0)],
          ["Balance Due", formatINR(totalAmount - (repair.advancePaid || 0))],
        ];
      })()
    : [
        ["Estimated Cost", formatINR(repair.estimatedCost || 0)],
        ["Advance Paid", formatINR(repair.advancePaid || 0)],
        ["Balance Due", formatINR(totalAmount - (repair.advancePaid || 0))],
      ];

  autoTable(doc, {
    startY: 86,
    head: [["Description", "Amount"]],
    body: gstBody,
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175] },
  });

  // Warranty
  const finalY = doc.lastAutoTable.finalY + 10;
  if (repair.warrantyDays) {
    doc.setFontSize(10);
    doc.text(`Warranty: ${repair.warrantyDays} days from delivery`, 14, finalY);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for your business!", 14, finalY + 16);
  doc.text("Powered by Dukaan Manager", 14, finalY + 22);

  doc.save(`invoice_${repair.tokenNo || "receipt"}.pdf`);
}

// Returns the PDF as a Blob (for uploading) without triggering a browser download.
export function generateInvoicePDFBlob({ repair, shopSettings }) {
  const doc = new jsPDF();
  const { shopName = "My Repair Shop", gst = "" } = shopSettings || {};

  doc.setFontSize(20);
  doc.setTextColor(30, 64, 175);
  doc.text(shopName, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  if (gst) doc.text(`GST: ${gst}`, 14, 28);
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(gst ? "TAX INVOICE" : "REPAIR INVOICE", 140, 20);
  doc.setFontSize(10);
  doc.text(`Token: #${repair.tokenNo || repair.id?.slice(0, 6).toUpperCase()}`, 140, 28);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 140, 34);

  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  doc.setFontSize(11);
  doc.text("Customer Details", 14, 50);
  doc.setFontSize(10);
  doc.text(`Name: ${repair.customerName || ""}`, 14, 58);
  doc.text(`Phone: ${repair.phone || ""}`, 14, 64);
  doc.text(`Device: ${repair.deviceModel || ""}`, 14, 70);
  doc.text(`Issue: ${repair.issue || ""}`, 14, 76);

  // Cost table — shows a GST breakdown only if the shop has a GST number set.
  const totalAmount2 = repair.finalCost || repair.estimatedCost || 0;
  const gstBody2 = gst
    ? (() => {
        const { taxable, cgst, sgst } = splitGST(totalAmount2);
        return [
          ["Taxable Value", formatINR(taxable)],
          ["CGST (9%)", formatINR(cgst)],
          ["SGST (9%)", formatINR(sgst)],
          ["Total (incl. GST)", formatINR(totalAmount2)],
          ["Advance Paid", formatINR(repair.advancePaid || 0)],
          ["Balance Due", formatINR(totalAmount2 - (repair.advancePaid || 0))],
        ];
      })()
    : [
        ["Estimated Cost", formatINR(repair.estimatedCost || 0)],
        ["Advance Paid", formatINR(repair.advancePaid || 0)],
        ["Balance Due", formatINR(totalAmount2 - (repair.advancePaid || 0))],
      ];

  autoTable(doc, {
    startY: 86,
    head: [["Description", "Amount"]],
    body: gstBody2,
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175] },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  if (repair.warrantyDays) {
    doc.setFontSize(10);
    doc.text(`Warranty: ${repair.warrantyDays} days from delivery`, 14, finalY);
  }

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for your business!", 14, finalY + 16);
  doc.text("Powered by Dukaan Manager", 14, finalY + 22);

  return doc.output("blob");
}
