/**
 * Formats a Ghana phone number with proper spacing
 * @param phone - The 9-digit phone number (without country code)
 * @returns Formatted phone number as "+233 XX XXX XXXX"
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any existing spaces/formatting
  const cleaned = phone.replace(/\s/g, '');

  // Format as XX XXX XXXX (for 9-digit Ghana numbers)
  if (cleaned.length === 9) {
    return `+233 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }

  // Fallback: return with +233 prefix
  return `+233 ${cleaned}`;
}
