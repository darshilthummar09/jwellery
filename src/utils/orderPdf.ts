import { Order } from '../context/ChatNotificationContext';

const PAGE_WIDTH = 595.28; // A4 in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/**
 * Re-encodes any browser-decodable image (PNG/JPEG/WEBP/etc, from a data URL) as a
 * JPEG via canvas, so jsPDF's addImage always receives a format it can embed reliably.
 */
function loadImageAsJpeg(dataUrl: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx || !canvas.width || !canvas.height) {
        resolve(null);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.82), width: canvas.width, height: canvas.height });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export interface GeneratedOrderPdf {
  dataUri: string;
  fileName: string;
  approxSize: number;
}

/** Builds a print-ready order/design brief PDF from an existing Order record — no schema changes. */
export async function generateOrderPdf(order: Order, generatedBy: string): Promise<GeneratedOrderPdf> {
  // Loaded on demand -- jsPDF (and its optional deps) are only needed when an
  // admin actually clicks Generate PDF, not on every visitor's initial bundle.
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Header band
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 0, PAGE_WIDTH, 64, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Dream Jewels — Order Specification', MARGIN, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Internal design brief for the production team', MARGIN, 52);
  y = 64 + 28;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(order.name || 'Untitled Order', MARGIN, y);
  y += 20;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`${order.category || 'Uncategorized'}  ·  Status: ${order.status}  ·  Priority: ${order.priority}`, MARGIN, y);
  y += 26;

  // Key/value field grid, two columns
  const fields: [string, string][] = [
    ['Customer', order.customerName || '—'],
    ['Designer', order.designerName || '—'],
    ['Metal', order.metal ? `${order.metal}${order.karat ? ` (${order.karat})` : ''}` : '—'],
    ['Size', order.size || 'Not specified'],
    ['Weight', order.weight || 'Not specified'],
    ['Budget', order.budget || '—'],
    ['Order Date', order.created || '—'],
    ['Due Date', order.due || '—'],
  ];

  const colWidth = CONTENT_WIDTH / 2;
  const rowHeight = 34;
  ensureSpace(Math.ceil(fields.length / 2) * rowHeight + 10);
  fields.forEach(([label, value], idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = MARGIN + col * colWidth;
    const rowY = y + row * rowHeight;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(label.toUpperCase(), x, rowY);
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), x, rowY + 14);
    doc.setFont('helvetica', 'normal');
  });
  y += Math.ceil(fields.length / 2) * rowHeight + 12;

  // Notes
  ensureSpace(40);
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 18;
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('CUSTOM REQUIREMENTS / NOTES', MARGIN, y);
  y += 14;
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85);
  const noteLines: string[] = doc.splitTextToSize(order.notes?.trim() || 'No additional notes were provided.', CONTENT_WIDTH);
  ensureSpace(noteLines.length * 13 + 10);
  doc.text(noteLines, MARGIN, y);
  y += noteLines.length * 13 + 18;

  if (order.rejectionReason) {
    ensureSpace(40);
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38);
    doc.text('REJECTION REASON', MARGIN, y);
    y += 14;
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10.5);
    const rejLines: string[] = doc.splitTextToSize(order.rejectionReason, CONTENT_WIDTH);
    ensureSpace(rejLines.length * 13 + 10);
    doc.text(rejLines, MARGIN, y);
    y += rejLines.length * 13 + 16;
  }

  // Images (embedded, not just referenced)
  const imageAssets =
    order.images && order.images.length > 0
      ? order.images.filter((img) => img.type?.startsWith('image/'))
      : order.image
        ? [{ id: 0, name: 'sample-image', url: order.image, size: 0, type: 'image/*' }]
        : [];
  const nonImageAssets = (order.images ?? []).filter((img) => img.type && !img.type.startsWith('image/'));

  if (imageAssets.length > 0) {
    ensureSpace(30);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 18;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`REFERENCE IMAGES (${imageAssets.length})`, MARGIN, y);
    y += 14;

    const gap = 12;
    const imgW = (CONTENT_WIDTH - gap) / 2;
    const imgH = imgW * 0.75;

    for (let i = 0; i < imageAssets.length; i++) {
      const asset = imageAssets[i];
      const col = i % 2;
      if (col === 0) ensureSpace(imgH + 26);
      const x = MARGIN + col * (imgW + gap);
      const processed = await loadImageAsJpeg(asset.url);
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, y, imgW, imgH);
      if (processed) {
        const scale = Math.min(imgW / processed.width, imgH / processed.height);
        const drawW = processed.width * scale;
        const drawH = processed.height * scale;
        doc.addImage(processed.dataUrl, 'JPEG', x + (imgW - drawW) / 2, y + (imgH - drawH) / 2, drawW, drawH);
      }
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      const label = asset.name.length > 42 ? `${asset.name.slice(0, 39)}...` : asset.name;
      doc.text(label, x, y + imgH + 11);
      if (col === 1 || i === imageAssets.length - 1) y += imgH + 26;
    }
  }

  if (nonImageAssets.length > 0) {
    ensureSpace(20 + nonImageAssets.length * 13);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('ADDITIONAL FILES (see chat thread for originals)', MARGIN, y);
    y += 14;
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    nonImageAssets.forEach((file) => {
      ensureSpace(13);
      doc.text(`• ${file.name}`, MARGIN, y);
      y += 13;
    });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  const generatedAt = new Date().toLocaleString();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated ${generatedAt} by ${generatedBy} · Dream Jewels`, MARGIN, PAGE_HEIGHT - 20);
    doc.text(`Page ${p} of ${pageCount}`, PAGE_WIDTH - MARGIN - 60, PAGE_HEIGHT - 20);
  }

  const safeName = (order.name || 'order').replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/(^-|-$)/g, '');
  const fileName = `${safeName || 'order'}-brief.pdf`;
  const dataUri = doc.output('datauristring');

  return { dataUri, fileName, approxSize: Math.round((dataUri.length * 3) / 4) };
}
