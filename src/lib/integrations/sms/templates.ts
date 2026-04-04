function shopLine(shopName: string, shopPhone?: string | null) {
  return shopPhone ? `${shopName} (${shopPhone})` : shopName
}

export function appointmentReminderSms({
  customerName,
  shopName,
  shopPhone,
  date,
  time,
  serviceTitle,
}: {
  customerName: string
  shopName: string
  shopPhone?: string | null
  date: string
  time: string
  serviceTitle: string
}): string {
  return (
    `Hi ${customerName}, this is a reminder from ${shopLine(shopName, shopPhone)}. ` +
    `Your appointment for "${serviceTitle}" is scheduled for ${date} at ${time}. ` +
    `Reply STOP to opt out.`
  )
}

export function estimateReadySms({
  customerName,
  shopName,
  shopPhone,
  estimateNumber,
  portalUrl,
}: {
  customerName: string
  shopName: string
  shopPhone?: string | null
  estimateNumber: string
  portalUrl: string
}): string {
  return (
    `Hi ${customerName}, your estimate ${estimateNumber} from ${shopLine(shopName, shopPhone)} ` +
    `is ready for your review: ${portalUrl} · Reply STOP to opt out.`
  )
}

export function vehicleReadySms({
  customerName,
  shopName,
  shopPhone,
  vehicleLabel,
}: {
  customerName: string
  shopName: string
  shopPhone?: string | null
  vehicleLabel: string
}): string {
  return (
    `Hi ${customerName}, your ${vehicleLabel} is ready for pickup at ` +
    `${shopLine(shopName, shopPhone)}. · Reply STOP to opt out.`
  )
}

export function invoiceSms({
  customerName,
  shopName,
  shopPhone,
  invoiceNumber,
  portalUrl,
}: {
  customerName: string
  shopName: string
  shopPhone?: string | null
  invoiceNumber: string
  portalUrl: string
}): string {
  return (
    `Hi ${customerName}, invoice ${invoiceNumber} from ${shopLine(shopName, shopPhone)} ` +
    `is available online: ${portalUrl} · Reply STOP to opt out.`
  )
}
