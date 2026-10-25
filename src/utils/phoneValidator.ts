/**
 * Côte d'Ivoire Phone Validation & Formatting Utilities
 * Standard CI numbers are 10 digits (since 2021 reform).
 * Prefixes:
 * - Orange: 07, 08, 09, etc.
 * - MTN: 05, 06, 04, etc.
 * - Moov: 01, 02, 03, etc.
 * - Wave: operates across all mobile networks
 *
 * NOTE: NEVER pre-fill any phone input by default.
 */

export type MobileOperator = 'Orange' | 'MTN' | 'Moov' | 'Wave' | 'Inconnu';

export interface PhoneValidationResult {
  isValid: boolean;
  cleanNumber: string;
  formattedNumber: string;
  operator: MobileOperator;
  error?: string;
}

/**
 * Normalizes phone numbers (strips spaces, dashes, +225 or 00225)
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/\s+/g, '').replace(/[-().]/g, '');
  if (cleaned.startsWith('+225')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('00225')) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith('225') && cleaned.length > 10) {
    cleaned = cleaned.substring(3);
  }
  return cleaned;
}

/**
 * Detects the telecom operator from a 10-digit CI phone number
 */
export function detectOperator(phone: string): MobileOperator {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.length < 2) return 'Inconnu';

  const prefix = cleaned.substring(0, 2);

  // Orange Côte d'Ivoire (07, 08, 09)
  if (['07', '08', '09'].includes(prefix)) {
    return 'Orange';
  }

  // MTN Côte d'Ivoire (05, 04, 06)
  if (['05', '04', '06'].includes(prefix)) {
    return 'MTN';
  }

  // Moov Africa Côte d'Ivoire (01, 02, 03)
  if (['01', '02', '03'].includes(prefix)) {
    return 'Moov';
  }

  return 'Inconnu';
}

/**
 * Validates a CI phone number
 */
export function validateCIPhoneNumber(phone: string): PhoneValidationResult {
  const cleaned = cleanPhoneNumber(phone);

  if (!cleaned) {
    return {
      isValid: false,
      cleanNumber: '',
      formattedNumber: '',
      operator: 'Inconnu',
      error: 'Le numéro de téléphone est requis'
    };
  }

  // Check numeric only
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      cleanNumber: cleaned,
      formattedNumber: phone,
      operator: 'Inconnu',
      error: 'Le numéro ne doit contenir que des chiffres'
    };
  }

  // 10 digits required in CI
  if (cleaned.length !== 10) {
    return {
      isValid: false,
      cleanNumber: cleaned,
      formattedNumber: cleaned,
      operator: 'Inconnu',
      error: `Numéro invalide: 10 chiffres requis (actuellement ${cleaned.length})`
    };
  }

  const operator = detectOperator(cleaned);
  const formatted = formatCIPhoneNumber(cleaned);

  return {
    isValid: true,
    cleanNumber: cleaned,
    formattedNumber: formatted,
    operator
  };
}

/**
 * Formats a 10-digit CI number into +225 XX XX XX XX XX
 */
export function formatCIPhoneNumber(cleaned: string): string {
  if (cleaned.length !== 10) return cleaned;
  return `+225 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
}
