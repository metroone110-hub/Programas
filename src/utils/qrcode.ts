import QRCode from 'qrcode';

export interface TicketQRPayload {
  ticketNumber: string;
  studentId: string;
  studentMatricule: string;
  canteenId: string;
  dishName: string;
  date: string;
  price: number;
  timestamp: number;
}

/**
 * Generate a base64 Data URL for a ticket QR Code
 */
export async function generateTicketQRCodeDataURL(payload: TicketQRPayload | string): Promise<string> {
  const content = typeof payload === 'string' ? payload : JSON.stringify({
    app: 'CROUK_RESTO_U',
    tkt: payload.ticketNumber,
    mat: payload.studentMatricule,
    cnt: payload.canteenId,
    dish: payload.dishName,
    date: payload.date,
    prc: payload.price,
    ts: payload.timestamp
  });

  try {
    return await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#1e293b', // slate-800
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    // Fallback QR API
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(content)}`;
  }
}

/**
 * Generate SVG string of the QR Code for crisp vector rendering
 */
export async function generateTicketQRCodeSVG(payload: TicketQRPayload | string): Promise<string> {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  try {
    return await QRCode.toString(content, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate SVG QR code:', err);
    return '';
  }
}

/**
 * Verify / Parse QR code string
 */
export function parseTicketQRData(qrString: string): Partial<TicketQRPayload> | null {
  try {
    const data = JSON.parse(qrString);
    if (data.app === 'CROUK_RESTO_U' || data.ticketNumber || data.tkt) {
      return {
        ticketNumber: data.tkt || data.ticketNumber,
        studentMatricule: data.mat || data.studentMatricule,
        canteenId: data.cnt || data.canteenId,
        dishName: data.dish || data.dishName,
        price: data.prc || data.price,
        date: data.date
      };
    }
    return null;
  } catch {
    // If simple ticket string e.g. "https://crou.ci/verify?tkt=CROU-2026-XXXXX"
    if (qrString.includes('tkt=')) {
      const match = qrString.match(/tkt=([A-Z0-9-]+)/);
      if (match) {
        return { ticketNumber: match[1] };
      }
    }
    return null;
  }
}
