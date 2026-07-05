import { VisitInvitation } from '../entities/visit-invitation.entity';
import QRCode from 'qrcode';

interface VisitInvitationEmailOptions {
  invitation: VisitInvitation;
  shareUrl: string;
  logoCid?: string;
  qrCid?: string;
  unitLabel?: string;
  residentName?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeQrRawValue(qrCode?: string | null): string {
  return (qrCode || '').trim();
}

function resolveImageExtension(contentType: string): string {
  const normalized = contentType.toLowerCase();
  if (normalized.includes('svg')) {
    return 'svg';
  }

  if (normalized.includes('jpeg') || normalized.includes('jpg')) {
    return 'jpg';
  }

  if (normalized.includes('gif')) {
    return 'gif';
  }

  if (normalized.includes('webp')) {
    return 'webp';
  }

  return 'png';
}

function extractInlineImage(qrCode?: string | null): { buffer: Buffer; contentType: string; extension: string } | null {
  const rawValue = normalizeQrRawValue(qrCode);
  if (!rawValue) {
    return null;
  }

  const dataUriMatch = rawValue.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if (dataUriMatch) {
    const contentType = dataUriMatch[1].toLowerCase();
    const base64 = dataUriMatch[2].replace(/\s+/g, '');
    return {
      buffer: Buffer.from(base64, 'base64'),
      contentType,
      extension: resolveImageExtension(contentType),
    };
  }

  if (/^[A-Za-z0-9+/=\r\n]+$/.test(rawValue) && rawValue.startsWith('iVBOR')) {
    return {
      buffer: Buffer.from(rawValue.replace(/\s+/g, ''), 'base64'),
      contentType: 'image/png',
      extension: 'png',
    };
  }

  return null;
}

export async function resolveQrInlineImage(qrCode?: string | null): Promise<{
  buffer: Buffer;
  contentType: string;
  extension: string;
} | null> {
  const inlineImage = extractInlineImage(qrCode);
  if (inlineImage) {
    return inlineImage;
  }

  const rawValue = normalizeQrRawValue(qrCode);
  if (!rawValue) {
    return null;
  }

  try {
    const buffer = await QRCode.toBuffer(rawValue, {
      type: 'png',
      width: 1200,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return {
      buffer,
      contentType: 'image/png',
      extension: 'png',
    };
  } catch {
    return null;
  }
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) {
    return 'Por definir';
  }

  return new Date(value).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function describeUsage(maxEntries?: number): string {
  if (!maxEntries || maxEntries <= 1) {
    return 'Solo entrada';
  }

  if (maxEntries === 2) {
    return 'Entrada y salida';
  }

  return `Multiuso durante vigencia (${maxEntries} accesos)`;
}

export function buildVisitInvitationEmailHtml({
  invitation,
  shareUrl,
  logoCid,
  qrCid,
  unitLabel,
  residentName,
}: VisitInvitationEmailOptions): string {
  const visitorName = escapeHtml(invitation.visitorName);
  const purpose = invitation.purpose ? escapeHtml(invitation.purpose) : 'Visita autorizada';
  const unit = escapeHtml(unitLabel || invitation.unitId);
  const resident = escapeHtml(residentName || 'Residente ZIII Living');
  const status = escapeHtml(invitation.status);
  const allowedDoors = Array.isArray(invitation.metadata?.allowedDoors) && invitation.metadata.allowedDoors.length
    ? invitation.metadata.allowedDoors.map((door: string) => escapeHtml(door)).join(', ')
    : 'Acceso autorizado';
  const usageLabel = describeUsage(Number(invitation.metadata?.maxEntries ?? 1));
  const showRawQrFallback = Boolean(
    invitation.qrCode && invitation.qrCode.length <= 120 && !invitation.qrCode.startsWith('data:image'),
  );
  const qrSection = qrCid
    ? `<img src="cid:${qrCid}" alt="QR de acceso ZIII Living" width="260" height="260" style="display:block;width:260px;height:260px;margin:0 auto;border-radius:28px;background:#ffffff;padding:14px;" />`
    : showRawQrFallback
      ? `<div style="padding:18px;border-radius:22px;background:#f3f8fc;font-size:13px;line-height:1.7;color:#123047;">${escapeHtml(invitation.qrCode)}</div>`
      : `<div style="padding:30px;border-radius:22px;background:#f3f8fc;font-size:14px;line-height:1.7;color:#486174;text-align:center;">El QR estara disponible en la vista movil del pase.</div>`;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pase de visitante | ZIII Living</title>
  </head>
  <body style="margin:0;padding:0;background:#eef4f8;font-family:Segoe UI,Arial,sans-serif;color:#123047;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:34px;overflow:hidden;box-shadow:0 22px 64px rgba(15,23,42,0.14);">
            <tr>
              <td style="padding:30px 34px;background:linear-gradient(135deg,#082f49 0%,#0f766e 54%,#0ea5e9 100%);color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="middle">
                      ${logoCid ? `<img src="cid:${logoCid}" alt="ZIII Living" width="156" style="display:block;max-width:156px;height:auto;" />` : `<div style="font-size:26px;font-weight:700;">ZIII Living</div>`}
                    </td>
                    <td align="right" valign="middle" style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#d7f7ff;">
                      Pase temporal
                    </td>
                  </tr>
                </table>
                <div style="margin-top:26px;font-size:14px;opacity:0.86;">Acceso autorizado para visitante</div>
                <div style="margin-top:8px;font-size:38px;line-height:1.06;font-weight:800;letter-spacing:-0.03em;">${visitorName}</div>
                <div style="margin-top:12px;max-width:470px;font-size:16px;line-height:1.7;color:#effcff;">${purpose}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 34px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom:20px;">
                      <div style="border:1px solid #d9e7ef;border-radius:30px;padding:22px;background:linear-gradient(180deg,#ffffff 0%,#f5fbff 100%);">
                        ${qrSection}
                      </div>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:0 8px 16px 0;width:50%;">
                      <div style="font-size:11px;color:#5a7487;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Unidad</div>
                      <div style="font-size:16px;line-height:1.5;font-weight:700;color:#123047;">${unit}</div>
                    </td>
                    <td style="padding:0 0 16px 8px;width:50%;">
                      <div style="font-size:11px;color:#5a7487;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Compartido por</div>
                      <div style="font-size:16px;line-height:1.5;font-weight:700;color:#123047;">${resident}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 8px 16px 0;width:50%;">
                      <div style="font-size:11px;color:#5a7487;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Valido desde</div>
                      <div style="font-size:15px;line-height:1.6;color:#123047;">${formatDateTime(invitation.validFrom)}</div>
                    </td>
                    <td style="padding:0 0 16px 8px;width:50%;">
                      <div style="font-size:11px;color:#5a7487;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Valido hasta</div>
                      <div style="font-size:15px;line-height:1.6;color:#123047;">${formatDateTime(invitation.validUntil)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 8px 16px 0;width:50%;">
                      <div style="font-size:11px;color:#5a7487;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Uso del pase</div>
                      <div style="font-size:15px;line-height:1.6;color:#123047;">${escapeHtml(usageLabel)}</div>
                    </td>
                    <td style="padding:0 0 16px 8px;width:50%;">
                      <div style="font-size:11px;color:#5a7487;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Estado</div>
                      <div style="font-size:15px;line-height:1.6;color:#123047;">${status}</div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:0 0 24px;">
                      <div style="font-size:11px;color:#5a7487;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Descripcion del acceso</div>
                      <div style="font-size:15px;line-height:1.7;color:#123047;">${allowedDoors}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 34px 34px;">
                <div style="border-radius:28px;background:#ecf8ff;padding:22px 24px;color:#123047;">
                  <div style="font-size:17px;font-weight:800;margin-bottom:8px;">Como usar este pase</div>
                  <div style="font-size:14px;line-height:1.8;">
                    1. Abre este correo desde tu celular.<br />
                    2. Presenta el QR completo frente al lector Hikvision.<br />
                    3. Usa brillo alto y evita recortar la imagen.<br />
                    4. Si el acceso no lee a la primera, espera un segundo y vuelve a mostrarlo de frente.
                  </div>
                </div>
                <div style="text-align:center;margin-top:22px;">
                  <a href="${shareUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:800;">
                    Abrir pase en el celular
                  </a>
                </div>
                <div style="margin-top:18px;text-align:center;font-size:12px;line-height:1.7;color:#5a7487;">
                  Este pase fue emitido desde ZIII Living. La vigencia y disponibilidad pueden cambiar segun la administracion.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildVisitInvitationEmailText(invitation: VisitInvitation, shareUrl: string, residentName?: string): string {
  const allowedDoors = Array.isArray(invitation.metadata?.allowedDoors) && invitation.metadata.allowedDoors.length
    ? invitation.metadata.allowedDoors.join(', ')
    : 'Acceso autorizado';

  return [
    `ZIII Living | Pase temporal para ${invitation.visitorName}`,
    invitation.purpose || 'Visita autorizada',
    `Compartido por: ${residentName || 'Residente ZIII Living'}`,
    `Valido desde: ${formatDateTime(invitation.validFrom)}`,
    `Valido hasta: ${formatDateTime(invitation.validUntil)}`,
    `Acceso: ${allowedDoors}`,
    `Uso: ${describeUsage(Number(invitation.metadata?.maxEntries ?? 1))}`,
    `Abrir pase: ${shareUrl}`,
  ].join('\n');
}

export function extractInlinePng(qrCode?: string | null): Buffer | null {
  const inlineImage = extractInlineImage(qrCode);
  if (!inlineImage || inlineImage.contentType !== 'image/png') {
    return null;
  }

  return inlineImage.buffer;
}
