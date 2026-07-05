import { VisitInvitation } from '@/types';

interface ShareTemplateOptions {
  invitation: VisitInvitation;
  qrDataUrl?: string;
  shareUrl: string;
  logoUrl: string;
}

interface PassPngOptions {
  invitation: VisitInvitation;
  qrDataUrl: string;
  logoUrl?: string;
  deviceImageUrl?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Por definir';
  }

  return new Date(value).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function buildShareMessage(invitation: VisitInvitation, shareUrl: string): string {
  const accessNote = invitation.metadata?.allowedDoors?.length
    ? `Accesos: ${invitation.metadata.allowedDoors.join(', ')}.`
    : 'Presenta este QR directamente en el lector.';

  return [
    `ZIII Living | Acceso para ${invitation.visitorName}`,
    `Vigencia: ${formatDateTime(invitation.validFrom)} a ${formatDateTime(invitation.validUntil)}.`,
    accessNote,
    `Abrir pase: ${shareUrl}`,
  ].join('\n');
}

export function buildInvitationEmailHtml({
  invitation,
  qrDataUrl,
  shareUrl,
  logoUrl,
}: ShareTemplateOptions): string {
  const visitorName = escapeHtml(invitation.visitorName);
  const purpose = invitation.purpose ? escapeHtml(invitation.purpose) : 'Visita autorizada';
  const unitLabel = escapeHtml(invitation.metadata?.unitLabel || invitation.unitId);
  const allowedDoors = Array.isArray(invitation.metadata?.allowedDoors) && invitation.metadata.allowedDoors.length
    ? invitation.metadata.allowedDoors.map((door: string) => escapeHtml(door)).join(', ')
    : 'Acceso configurado por la administracion';
  const qrSection = qrDataUrl
    ? `<img src="${qrDataUrl}" alt="QR de acceso ZIII Living" width="240" height="240" style="display:block;width:240px;height:240px;margin:0 auto;border-radius:24px;background:#ffffff;padding:16px;" />`
    : `<div style="padding:28px;border-radius:24px;background:#f3f7fb;color:#486174;font-size:14px;line-height:1.6;text-align:center;">El QR nativo se adjuntara automaticamente cuando Hikvision lo devuelva al sistema.</div>`;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pase de visitante | ZIII Living</title>
  </head>
  <body style="margin:0;padding:0;background:#eef4f8;font-family:Segoe UI,Arial,sans-serif;color:#123047;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:32px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,#082f49 0%,#0f766e 52%,#0ea5e9 100%);">
                <table role="presentation" width="100%">
                  <tr>
                    <td valign="middle">
                      <img src="${logoUrl}" alt="ZIII Living" width="148" style="display:block;max-width:148px;height:auto;" />
                    </td>
                    <td align="right" valign="middle" style="color:#d8f5ff;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">
                      Pase de visitante
                    </td>
                  </tr>
                </table>
                <div style="margin-top:28px;color:#ffffff;">
                  <div style="font-size:14px;opacity:0.86;">Acceso autorizado</div>
                  <div style="font-size:34px;line-height:1.12;font-weight:700;margin-top:8px;">${visitorName}</div>
                  <div style="font-size:16px;line-height:1.6;max-width:420px;opacity:0.92;margin-top:12px;">
                    ${purpose}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:0 0 20px;">
                      <div style="border:1px solid #d9e7ef;border-radius:28px;padding:22px;background:linear-gradient(180deg,#ffffff 0%,#f6fbff 100%);">
                        ${qrSection}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding:0 8px 16px 0;width:50%;">
                            <div style="font-size:12px;color:#5a7487;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Unidad</div>
                            <div style="font-size:16px;font-weight:700;color:#123047;">${unitLabel}</div>
                          </td>
                          <td style="padding:0 0 16px 8px;width:50%;">
                            <div style="font-size:12px;color:#5a7487;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Estado</div>
                            <div style="font-size:16px;font-weight:700;color:#123047;">${escapeHtml(invitation.status)}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 8px 16px 0;width:50%;">
                            <div style="font-size:12px;color:#5a7487;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Valido desde</div>
                            <div style="font-size:15px;line-height:1.5;color:#123047;">${formatDateTime(invitation.validFrom)}</div>
                          </td>
                          <td style="padding:0 0 16px 8px;width:50%;">
                            <div style="font-size:12px;color:#5a7487;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Valido hasta</div>
                            <div style="font-size:15px;line-height:1.5;color:#123047;">${formatDateTime(invitation.validUntil)}</div>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding:0 0 22px;">
                            <div style="font-size:12px;color:#5a7487;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Accesos permitidos</div>
                            <div style="font-size:15px;line-height:1.6;color:#123047;">${allowedDoors}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px;">
                <div style="border-radius:26px;background:#ecf8ff;padding:20px 22px;color:#123047;">
                  <div style="font-size:16px;font-weight:700;margin-bottom:8px;">Como usar este pase</div>
                  <div style="font-size:14px;line-height:1.7;">
                    1. Abre este correo desde tu celular.<br />
                    2. Muestra el QR completo frente al lector Hikvision.<br />
                    3. Evita capturas recortadas, zoom excesivo o brillo bajo.
                  </div>
                </div>
                <div style="text-align:center;margin-top:22px;">
                  <a href="${shareUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;">
                    Abrir pase en el celular
                  </a>
                </div>
                <div style="font-size:12px;line-height:1.7;color:#5a7487;text-align:center;margin-top:18px;">
                  Este pase fue emitido desde ZIII Living y puede estar sujeto a cambios de vigencia o revocacion.
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

export function buildDemoInvitation(id = 'demo'): VisitInvitation {
  const validFrom = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const validUntil = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  return {
    id,
    propertyId: 'demo-property',
    unitId: 'demo-unit',
    visitorName: 'Demo QR ZIII Living',
    visitorPhone: '5550001122',
    visitorEmail: 'demo.visita@ziiiliving.local',
    purpose: 'Prueba visual de pase movil',
    validFrom,
    validUntil,
    status: 'approved',
    createdBy: 'demo-resident',
    approvedBy: 'demo-admin',
    approvedAt: new Date().toISOString(),
    accessControlPassId: `demo-pass-${id}`,
    qrCode: `ZIILIVING-DEMO-QR-${id}`,
    pinCode: '4821',
    metadata: {
      comment: 'Demo visual generada por Codex',
      allowedDoors: ['Puerta principal', 'Lobby', 'Estacionamiento'],
      maxEntries: 1,
      unitLabel: 'Torre A - Depto 301',
    },
    createdAt: new Date().toISOString(),
  };
}

export async function buildQrPreviewDataUrl(qrCode?: string): Promise<string> {
  if (!qrCode) {
    return '';
  }

  if (qrCode.startsWith('data:image')) {
    return await upscaleQrDataUrl(qrCode);
  }

  if (looksLikeBase64Png(qrCode)) {
    return await upscaleQrDataUrl(`data:image/png;base64,${qrCode}`);
  }

  const QRCode = await import('qrcode');
  return QRCode.toDataURL(qrCode, {
    width: 1200,
    margin: 4,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

export async function buildPassPngBlob({ invitation, qrDataUrl, logoUrl, deviceImageUrl }: PassPngOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 2280;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No se pudo generar el canvas del pase');
  }

  const unitLabel = compactUnitLabel(invitation.metadata?.unitLabel || invitation.unitId || 'Unidad por definir');
  const accessLabel =
    Array.isArray(invitation.metadata?.allowedDoors) && invitation.metadata.allowedDoors.length
      ? compactText(String(invitation.metadata.allowedDoors[0]), 26)
      : 'Autorizado';
  const purpose = compactText(invitation.purpose || 'Visita', 24);
  const validFrom = formatShortDateTime(invitation.validFrom);
  const validUntil = formatShortDateTime(invitation.validUntil);
  const logoImage = logoUrl ? await loadImage(logoUrl).catch(() => null) : null;
  const deviceImage = deviceImageUrl ? await loadImage(deviceImageUrl).catch(() => null) : null;
  const qrImage = await loadImage(qrDataUrl);
  context.imageSmoothingEnabled = false;

  context.fillStyle = '#eff6fb';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#11273a';
  fillRoundedRect(context, 18, 18, 1044, 2244, 38);

  context.fillStyle = '#f8fbff';
  fillRoundedRect(context, 42, 42, 996, 2196, 34);

  const topGlow = context.createRadialGradient(540, 120, 10, 540, 120, 640);
  topGlow.addColorStop(0, 'rgba(14,165,233,0.16)');
  topGlow.addColorStop(1, 'rgba(14,165,233,0)');
  context.fillStyle = topGlow;
  context.fillRect(42, 42, 996, 2196);

  if (logoImage) {
    context.drawImage(logoImage, 88, 86, 178, 66);
  } else {
    context.fillStyle = '#173042';
    context.font = '800 48px "Segoe UI", sans-serif';
    context.fillText('ZIII Living', 88, 132);
  }

  context.fillStyle = '#425e73';
  context.font = '700 24px "Segoe UI", sans-serif';
  context.fillText('LISTO PARA PORTERIA', 760, 132);

  const bannerGradient = context.createLinearGradient(92, 182, 988, 182);
  bannerGradient.addColorStop(0, '#1f5c61');
  bannerGradient.addColorStop(1, '#4aa3df');
  context.fillStyle = bannerGradient;
  fillRoundedRect(context, 92, 182, 816, 134, 30);

  context.fillStyle = '#dff7ff';
  context.font = '800 18px "Segoe UI", sans-serif';
  context.fillText('VISITANTE AUTORIZADO', 132, 236);
  context.fillStyle = '#ffffff';
  context.font = '800 56px "Segoe UI", sans-serif';
  drawWrappedText(context, invitation.visitorName, 132, 292, 640, 52);

  context.fillStyle = '#eef5fb';
  fillRoundedRect(context, 92, 356, 856, 930, 46);
  context.fillStyle = '#ffffff';
  fillRoundedRect(context, 134, 398, 772, 846, 38);
  context.drawImage(qrImage, 160, 424, 720, 720);

  drawStatTile(context, 92, 1322, 856, 122, 'ACCESO', accessLabel);
  drawStatTile(context, 92, 1468, 412, 150, 'DESDE', validFrom);
  drawStatTile(context, 536, 1468, 412, 150, 'HASTA', validUntil);
  drawStatTile(context, 92, 1642, 856, 112, 'UNIDAD', unitLabel);

  context.fillStyle = '#e9f7ff';
  fillRoundedRect(context, 92, 1786, 856, 176, 34);
  context.fillStyle = '#123047';
  context.font = '700 32px "Segoe UI", sans-serif';
  context.fillText('LECTURA', 128, 1842);
  context.font = '700 24px "Segoe UI", sans-serif';
  drawWrappedText(context, 'MUESTRA EL PASE COMPLETO CON BRILLO ALTO.', 128, 1890, 730, 32);

  context.fillStyle = '#eef5fb';
  fillRoundedRect(context, 92, 1992, 856, 190, 34);
  context.fillStyle = '#123047';
  context.font = '700 28px "Segoe UI", sans-serif';
  context.fillText('EN EL LECTOR HIKVISION', 128, 2046);
  context.font = '700 22px "Segoe UI", sans-serif';
  drawWrappedText(context, 'TOCA EL ICONO QR Y MUESTRA ESTE PASE.', 128, 2092, 434, 30);
  if (deviceImage) {
    drawContainImage(context, deviceImage, 612, 2014, 276, 156);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo exportar el pase PNG'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen ${src}`));
    image.src = src;
  });
}

async function upscaleQrDataUrl(source: string): Promise<string> {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  const qrSize = 1200;
  const margin = 96;
  canvas.width = qrSize + margin * 2;
  canvas.height = qrSize + margin * 2;

  const context = canvas.getContext('2d');
  if (!context) {
    return source;
  }

  context.imageSmoothingEnabled = false;
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, margin, margin, qrSize, qrSize);
  return canvas.toDataURL('image/png');
}

function drawContainImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a2f49');
  gradient.addColorStop(0.5, '#0f766e');
  gradient.addColorStop(1, '#38bdf8');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width * 0.2, height * 0.78, 40, width * 0.2, height * 0.78, 520);
  glow.addColorStop(0, 'rgba(255,255,255,0.28)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
}

function drawInfoCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
) {
  context.fillStyle = 'rgba(255,255,255,0.15)';
  fillRoundedRect(context, x, y, width, height, 28);
  context.fillStyle = 'rgba(225,244,255,0.72)';
  context.font = '700 18px "Segoe UI", sans-serif';
  context.fillText(label, x + 20, y + 34);
  context.fillStyle = '#ffffff';
  context.font = '700 28px "Segoe UI", sans-serif';
  drawWrappedText(context, value, x + 20, y + 72, width - 40, 34);
}

function drawStatTile(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
) {
  context.fillStyle = '#f2f7fb';
  fillRoundedRect(context, x, y, width, height, 26);
  context.fillStyle = 'rgba(18,48,71,0.56)';
  context.font = '700 16px "Segoe UI", sans-serif';
  context.fillText(label, x + 18, y + 30);
  context.fillStyle = '#123047';
  context.font = '700 24px "Segoe UI", sans-serif';
  drawWrappedText(context, value, x + 18, y + 60, width - 36, 30);
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fill();
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const paragraphs = text.split('\n');
  let currentY = y;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > maxWidth && line) {
        context.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = candidate;
      }
    }

    if (line) {
      context.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  }
}

function looksLikeBase64Png(value: string): boolean {
  return /^[A-Za-z0-9+/=\r\n]+$/.test(value) && value.startsWith('iVBOR');
}

function formatShortDateTime(value?: string): string {
  if (!value) {
    return 'Por definir';
  }

  return new Date(value).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function compactUnitLabel(value: string): string {
  if (/^[0-9a-f]{8}-/i.test(value)) {
    return `Unidad ${value.slice(0, 8)}`;
  }

  return compactText(value, 24);
}

function compactText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
