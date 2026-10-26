/**
 * Jeko Payment Gateway Configuration (pay.jeko.africa)
 * Configured with live merchant keys for CROU Korhogo (UPGC).
 * Supports Wave, Orange Money, MTN MoMo, and Moov Money across Côte d'Ivoire.
 */

export interface JekoConfig {
  merchantId: string;
  apiKey: string;
  webhookSecret: string;
  environment: 'sandbox' | 'live';
  currency: 'XOF';
  webhookUrl: string;
}

const env = (import.meta as any).env || {};

export const jekoConfig: JekoConfig = {
  merchantId: env.VITE_JEKO_MERCHANT_ID || '32d9d6ef-d182-47bc-82ba-9c92c41510f3',
  apiKey: env.VITE_JEKO_API_KEY || 'jeko_76053a559816e40d1db0edcf7976413a7aed85fdcc27cc6aadc0f0de9a9a85ec',
  webhookSecret: env.JEKO_WEBHOOK_SECRET || '2b685054e12f163038602111f54a7d4bc3b9dc3e64df899761f50088c1d1e6e0',
  environment: (env.VITE_JEKO_ENVIRONMENT as 'sandbox' | 'live') || 'live',
  currency: 'XOF',
  webhookUrl: 'https://programas-upgc.metroone110.workers.dev/api/webhook/jeko'
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
  paymentMethod?: 'Wave' | 'Orange' | 'MTN' | 'Moov';
}) {
  const reference = `CROUK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    merchant_id: jekoConfig.merchantId,
    api_key: jekoConfig.apiKey,
    reference,
    amount: params.amount,
    currency: jekoConfig.currency,
    description: `Achat ${params.ticketQuantity} ticket(s) Resto U CROU Korhogo - ${params.dishName}`,
    customer: {
      name: params.studentName,
      phone: params.studentPhone,
      matricule: params.studentMatricule
    },
    payment_method: params.paymentMethod || 'Wave',
    webhook_url: jekoConfig.webhookUrl,
    return_url: window.location.origin
  };
}
