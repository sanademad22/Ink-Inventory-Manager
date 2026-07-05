import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface VoucherPDFData {
  transactionId: number;
  employeeName: string;
  employeeJobTitle: string;
  inkModel: string;
  quantityWithdrawn: number;
  transactionTimestamp: string;
}

const fetchLogoBase64 = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = "/elite-logo.png";
  });
};

export async function generateVoucherPDF(data: VoucherPDFData, returnDoc: boolean = false): Promise<jsPDF | void> {
  const doc = new jsPDF();
  let logoBase64 = null;
  
  try {
    logoBase64 = await fetchLogoBase64();
  } catch (err) {
    console.error("Failed to load Elite logo", err);
  }

  // Header
  if (logoBase64) {
    // Add logo to the left
    doc.addImage(logoBase64, 'PNG', 15, 10, 70, 20, '', 'FAST');
    
    // Add text to the right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 80, 120); // Deep Cyan/Navy
    doc.text("PRINTER INK ISSUE VOUCHER", 195, 20, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Elite Fire Protection Systems W.L.L.", 195, 27, { align: "right" });
  } else {
    // Fallback without logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 80, 120);
    doc.text("PRINTER INK ISSUE VOUCHER", 105, 25, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Elite Fire Protection Systems W.L.L.", 105, 32, { align: "center" });
  }

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 38, 195, 38);

  // Voucher Info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  const dateFormatted = format(new Date(data.transactionTimestamp), "PPpp");

  // Track y-position using return value from autoTable
  let finalY = 45;

  autoTable(doc, {
    startY: finalY,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [80, 80, 80] as [number, number, number], cellWidth: 50 },
      1: { cellWidth: 100 },
    },
    body: [
      ["Transaction ID:", `TRX-${String(data.transactionId).padStart(6, "0")}`],
      ["Date & Time:", dateFormatted],
    ],
    didDrawPage: (hookData) => {
      finalY = hookData.cursor?.y ?? finalY;
    },
  });

  // Move y past the first table
  finalY = finalY + 10;

  // Main Details Table
  autoTable(doc, {
    startY: finalY,
    theme: "grid",
    headStyles: { fillColor: [0, 122, 166] as [number, number, number], textColor: 255, fontStyle: "bold" },
    bodyStyles: { textColor: 50, fontSize: 11 },
    head: [["Item Details", "Information"]],
    body: [
      ["Employee Name", data.employeeName],
      ["Job Title", data.employeeJobTitle],
      ["Ink Model Withdrawn", data.inkModel],
      ["Quantity", String(data.quantityWithdrawn)],
    ],
    didDrawPage: (hookData) => {
      finalY = hookData.cursor?.y ?? finalY;
    },
  });

  // Footer / Signatures
  const sigY = finalY + 30;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  doc.line(20, sigY, 80, sigY);
  doc.text("Issued By (Signature)", 20, sigY + 6);

  doc.line(130, sigY, 190, sigY);
  doc.text("Received By (Signature)", 130, sigY + 6);

  if (returnDoc) {
    return doc;
  }
  
  // Save the PDF
  doc.save(`Ink-Voucher-TRX-${data.transactionId}.pdf`);
}

export async function printVoucher(data: VoucherPDFData): Promise<void> {
  const doc = await generateVoucherPDF(data, true) as jsPDF;
  doc.autoPrint();
  doc.output('dataurlnewwindow');
}
