/**
 * Zero-Knowledge PII Sanitizer for Inbound OmniChannel Messages
 */
export function maskPII(text: string): string {
  if (!text) return "";
  let masked = text;
  // Emails
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[VAULT_SEC_EMAIL]");
  // Phone numbers (international and 10-digit formats)
  masked = masked.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[VAULT_SEC_PHONE]");
  masked = masked.replace(/\b\d{10}\b/g, "[VAULT_SEC_PHONE]");
  // Credit / Debit card numbers
  masked = masked.replace(/\b(?:\d[ -]*?){13,16}\b/g, "[VAULT_SEC_CARD]");
  masked = masked.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[VAULT_SEC_CARD]");
  return masked;
}
