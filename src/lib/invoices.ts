export interface ReceiptData {
  lines: { refId: string; name: string; price: number; qty: number; modifiers?: string[] }[]
  subtotal: number
  discount: number
  tax: number
  total: number
  tenders: { method: string; amount: number }[]
  table?: string
  date: number
  invoiceNo: string
}

export interface InvoiceCompany {
  name?: string
  legalName?: string
  address?: string
  phone?: string
  email?: string
  taxId?: string
  receiptHeader?: string
  receiptFooter?: string
}

export async function exportA4(data: ReceiptData, appName: string, company?: InvoiceCompany): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  let y = margin
  const paid = data.tenders.reduce((s, t) => s + t.amount, 0)
  const change = Math.max(0, paid - data.total)
  const title = company?.name || company?.legalName || appName

  doc.setFontSize(18)
  doc.text(title, margin, y)
  y += 14
  if (company?.receiptHeader) {
    doc.setFontSize(9)
    doc.text(company.receiptHeader, margin, y)
    y += 12
  }
  if (company?.address) {
    doc.setFontSize(9)
    doc.text(company.address, margin, y)
    y += 12
  }
  const metaLine = [company?.phone, company?.email].filter(Boolean).join(' · ')
  if (metaLine) {
    doc.setFontSize(9)
    doc.text(metaLine, margin, y)
    y += 12
  }
  if (company?.taxId) {
    doc.setFontSize(9)
    doc.text(`Tax / VAT: ${company.taxId}`, margin, y)
    y += 12
  }
  const headerBottom = y + 8

  doc.setFontSize(10)
  doc.text(`Invoice  ${data.invoiceNo}`, margin, headerBottom)
  doc.text(new Date(data.date).toLocaleString(), 410, headerBottom)
  y = headerBottom + 16
  if (data.table) {
    doc.text(`Table: ${data.table}`, margin, y)
    y += 16
  }
  y += 8
  doc.setFontSize(11)
  doc.text('Item', margin, y)
  doc.text('Qty', 300, y)
  doc.text('Total', 480, y, { align: 'right' })
  y += 6
  doc.line(margin, y, 555, y)
  y += 16
  doc.setFontSize(10)
  data.lines.forEach((l) => {
    doc.text(l.name, margin, y)
    doc.text(String(l.qty), 300, y)
    doc.text((l.price * l.qty).toFixed(2), 480, y, { align: 'right' })
    y += 16
  })
  y += 6
  doc.line(margin, y, 555, y)
  y += 20
  doc.setFontSize(10)
  doc.text(`Subtotal: ${(data.subtotal).toFixed(2)}`, 360, y)
  y += 14
  if (data.discount > 0) {
    doc.text(`Discount: -${(data.discount).toFixed(2)}`, 360, y)
    y += 14
  }
  if (data.tax > 0) {
    doc.text(`Tax: ${(data.tax).toFixed(2)}`, 360, y)
    y += 14
  }
  doc.setFontSize(12)
  doc.text(`Total: ${(data.total).toFixed(2)}`, 360, y)
  y += 20
  doc.setFontSize(10)
  data.tenders.forEach((t) => {
    doc.text(`${t.method}: ${t.amount.toFixed(2)}`, 360, y)
    y += 14
  })
  if (change > 0) {
    doc.text(`Change: ${change.toFixed(2)}`, 360, y)
  }

  if (company?.receiptFooter) {
    doc.setFontSize(9)
    doc.text(company.receiptFooter, margin, 800, { align: 'center', maxWidth: 515 })
  }
  doc.save(`${data.invoiceNo}.pdf`)
}
