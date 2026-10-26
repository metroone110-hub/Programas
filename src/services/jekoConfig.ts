/**
 * Jeko Payment Gateway Configuration (pay.jeko.africa)
 * Supports Wave, Orange Money, MTN MoMo, and Moov Money across Côte d'Ivoire.
 */

export interface JekoConfig {
  merchantId: string;
  publicKey: string;
  environment: 'sandbox' | 'live';
  currency: 'XOF';
  callbackUrl?: string;
}

const env = (import.meta as any).env || {};

export const jekoConfig: JekoConfig = {
  merchantId: env.VITE_JEKO_MERCHANT_ID || 'crouk-upgc-resto',
  publicKey: env.VITE_JEKO_PUBLIC_KEY || 'jeko_pub_live_crouk2026',
  environment: (env.VITE_JEKO_ENVIRONMENT as 'sandbox' | 'live') || 'live',
  currency: 'XOF'
};

/**
 * Helper to generate a Jeko checkout payload
 */
export function createJekoTransactionPayload(params: {
  amount: number; // e.g. 200, 400, 2000 FCFA
  studentMatricule: string;
  studentPhone: string;
  studentName: string;
  dishName: string;
  ticketQuantity: number;
}) {
  const reference = `CROUK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    merchant_id: jekoConfig.merchantId,
    public_key: jekoConfig.publicKey,
    reference,
    amount: params.amount,
    currency: jekoConfig.currency,
    description: `Achat ${params.ticketQuantity} ticket(s) Resto U CROU Korhogo - ${params.dishName}`,
    customer: {
      name: params.studentName,
      phone: params.studentPhone,
      matricule: params.studentMatricule
    },
    payment_methods: ['WAVE', 'ORANGE_MONEY', 'MTN_MOMO', 'MOOV_MONEY'],
    return_url: window.location.origin
  };
}
