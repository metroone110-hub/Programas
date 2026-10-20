/**
 * Cote d'Ivoire (CI) Phone Number Validator & Operator Detector
 * PNN 2021: 10-digit mobile numbering plan
 * - Moov Africa: Prefix 01 (01XXXXXXXX)
 * - MTN CI: Prefix 05 (05XXXXXXXX)
 * - Orange CI: Prefix 07 (07XXXXXXXX)
 */

export type IvorianOperator = 'MOOV' | 'MTN' | 'ORANGE' | 'UNKNOWN';

export interface PhoneValidationResult {
  valid: boolean;
  operator: IvorianOperator;
  cleanPhone: string; // 10 digits without spaces (e.g. 0102030405)
  internationalPhone: string; // 225XXXXXXXXXX
  formattedPhone: string; // 01 02 03 04 05
  error?: string;
  suggestedMethod?: 'MOOV_MONEY' | 'MTN_MOMO';
}

/**
 * Normalizes input phone string by stripping spaces, hyphens, parentheses, etc.
 */
export function normalizeIvorianPhone(raw: string): string {
  let digits = raw.trim().replace(/[^\d]/g, '');

  // Handle +225 or 00225 or 225 prefix
  if (digits.startsWith('00225')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('225') && digits.length === 13) {
    digits = digits.slice(3);
  }

  return digits;
}

/**
 * Formats a 10-digit Ivorian phone number as XX XX XX XX XX
 */
export function formatIvorianPhone(digits: string): string {
  const clean = digits.replace(/[^\d]/g, '').slice(0, 10);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    parts.push(clean.slice(i, i + 2));
  }
  return parts.join(' ');
}

/**
 * Detects the telecom operator from the 2-digit prefix
 */
export function detectIvorianOperator(digits: string): IvorianOperator {
  if (digits.length < 2) return 'UNKNOWN';
  const prefix = digits.slice(0, 2);
  if (prefix === '01') return 'MOOV';
  if (prefix === '05') return 'MTN';
  if (prefix === '07') return 'ORANGE';
  return 'UNKNOWN';
}

/**
 * Validates an Ivorian mobile number against expected payment method (MOOV_MONEY or MTN_MOMO)
 */
export function validateIvorianPhoneNumber(
  rawPhone: string,
  expectedMethod?: 'MOOV_MONEY' | 'MTN_MOMO' | 'DEMO'
): PhoneValidationResult {
  const digits = normalizeIvorianPhone(rawPhone);
  const operator = detectIvorianOperator(digits);
  const formatted = formatIvorianPhone(digits);
  const international = `225${digits}`;

  // Allow bypass in DEMO simulation mode if non-empty
  if (expectedMethod === 'DEMO') {
    if (!digits || digits.length < 4) {
      return {
        valid: false,
        operator: 'UNKNOWN',
        cleanPhone: digits,
        internationalPhone: international,
        formattedPhone: formatted,
        error: "Veuillez entrer un numéro de téléphone pour l'émission du ticket test.",
      };
    }
    return {
      valid: true,
      operator,
      cleanPhone: digits,
      internationalPhone: international,
      formattedPhone: formatted,
    };
  }

  // Check 10-digit requirement
  if (digits.length !== 10) {
    return {
      valid: false,
      operator,
      cleanPhone: digits,
      internationalPhone: international,
      formattedPhone: formatted,
      error: `En Côte d'Ivoire, les numéros de téléphone comportent exactement 10 chiffres (vous avez saisi ${digits.length} chiffre${digits.length > 1 ? 's' : ''}).`,
    };
  }

  // Validate specifically for Moov Money
  if (expectedMethod === 'MOOV_MONEY') {
    if (operator === 'MTN') {
      return {
        valid: false,
        operator,
        cleanPhone: digits,
        internationalPhone: international,
        formattedPhone: formatted,
        suggestedMethod: 'MTN_MOMO',
        error: `Le numéro ${formatted} est un numéro MTN (préfixe 05). Pour payer avec Moov Money, veuillez insérer un numéro Moov commençant par 01 (ex: 01 02 03 04 05), ou basculez sur l'option MTN MoMo.`,
      };
    }

    if (operator === 'ORANGE') {
      return {
        valid: false,
        operator,
        cleanPhone: digits,
        internationalPhone: international,
        formattedPhone: formatted,
        error: `Le numéro ${formatted} est un numéro Orange (préfixe 07). La cantine CROU-K accepte actuellement Moov Money (01...) et MTN MoMo (05...).`,
      };
    }

    if (operator !== 'MOOV') {
      return {
        valid: false,
        operator,
        cleanPhone: digits,
        internationalPhone: international,
        formattedPhone: formatted,
        error: `Numéro Moov non valide : les numéros Moov Côte d'Ivoire commencent obligatoirement par 01 (ex: 01 02 03 04 05).`,
      };
    }

    return {
      valid: true,
      operator: 'MOOV',
      cleanPhone: digits,
      internationalPhone: international,
      formattedPhone: formatted,
    };
  }

  // Validate specifically for MTN MoMo
  if (expectedMethod === 'MTN_MOMO') {
    if (operator === 'MOOV') {
      return {
        valid: false,
        operator,
        cleanPhone: digits,
        internationalPhone: international,
        formattedPhone: formatted,
        suggestedMethod: 'MOOV_MONEY',
        error: `Le numéro ${formatted} est un numéro Moov (préfixe 01). Pour payer avec MTN MoMo, veuillez insérer un numéro MTN commençant par 05 (ex: 05 01 23 45 67), ou basculez sur l'option Moov Money.`,
      };
    }

    if (operator === 'ORANGE') {
      return {
        valid: false,
        operator,
        cleanPhone: digits,
        internationalPhone: international,
        formattedPhone: formatted,
        error: `Le numéro ${formatted} est un numéro Orange (préfixe 07). La cantine CROU-K accepte actuellement MTN MoMo (05...) et Moov Money (01...).`,
      };
    }

    if (operator !== 'MTN') {
      return {
        valid: false,
        operator,
        cleanPhone: digits,
        internationalPhone: international,
        formattedPhone: formatted,
        error: `Numéro MTN non valide : les numéros MTN Côte d'Ivoire commencent obligatoirement par 05 (ex: 05 01 23 45 67).`,
      };
    }

    return {
      valid: true,
      operator: 'MTN',
      cleanPhone: digits,
      internationalPhone: international,
      formattedPhone: formatted,
    };
  }

  // Generic validation if no method specified
  if (operator === 'UNKNOWN') {
    return {
      valid: false,
      operator,
      cleanPhone: digits,
      internationalPhone: international,
      formattedPhone: formatted,
      error: `Préfixe non reconnu. Veuillez saisir un numéro Moov (01...) ou MTN (05...).`,
    };
  }

  return {
    valid: true,
    operator,
    cleanPhone: digits,
    internationalPhone: international,
    formattedPhone: formatted,
    suggestedMethod: operator === 'MOOV' ? 'MOOV_MONEY' : (operator === 'MTN' ? 'MTN_MOMO' : undefined),
  };
}
