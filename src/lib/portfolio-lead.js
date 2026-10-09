export function portfolioLeadPayload(userId, lead = {}) {
  const subject = String(lead.subject || '').trim()
  const message = String(lead.message || '').trim()
  return {
    user_id: userId,
    name: String(lead.name || '').trim(),
    email: String(lead.email || '').trim(),
    phone: String(lead.phone || '').trim(),
    message: subject ? `Assunto: ${subject}\n\n${message}` : message,
  }
}
