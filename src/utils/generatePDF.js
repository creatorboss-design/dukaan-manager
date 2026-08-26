import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  doc.text("REPAIR INVOICE", 140, 20);
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

  // Cost table
  autoTable(doc, {
    startY: 86,
    head: [["Description", "Amount (₹)"]],
    body: [
      ["Estimated Cost", `₹ ${repair.estimatedCost || 0}`],
      ["Advance Paid", `₹ ${repair.advancePaid || 0}`],
      ["Balance Due", `₹ ${(repair.finalCost || repair.estimatedCost || 0) - (repair.advancePaid || 0)}`],
    ],
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
