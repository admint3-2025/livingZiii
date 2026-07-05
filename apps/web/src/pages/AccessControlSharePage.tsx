import React, { useEffect, useMemo, useState } from 'react';
import logo from '@/assets/ZIIILiving3.png';
import hikvisionDevice from '@/assets/hikvision-device.png';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/services/api-client';
import { SendVisitInvitationEmailResponse, VisitInvitation } from '@/types';
import {
  buildDemoInvitation,
  buildPassPngBlob,
  buildQrPreviewDataUrl,
} from '@/utils/accessControlShare';
import '@/styles/access-control-share.css';

const EMAIL_SEND_TIMEOUT_MS = 45000;

export const AccessControlSharePage: React.FC = () => {
  const invitationApi = useApi<VisitInvitation>();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [localInvitation, setLocalInvitation] = useState<VisitInvitation | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const [pngBusy, setPngBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTarget, setEmailTarget] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const invitationId = window.location.pathname.split('/').filter(Boolean).pop() || 'demo';

  useEffect(() => {
    void loadInvitation(invitationId);
  }, [invitationId]);

  const invitation = invitationApi.data || localInvitation;
  const logoUrl = useMemo(() => `${window.location.origin}${logo}`, []);
  const deviceImageUrl = useMemo(() => `${window.location.origin}${hikvisionDevice}`, []);
  const unitLabel = useMemo(() => formatCompactUnitLabel(invitation?.metadata?.unitLabel || invitation?.unitId), [invitation]);
  const accessLabel = useMemo(() => formatCompactAccess(invitation?.metadata?.allowedDoors), [invitation]);
  const validFromLabel = useMemo(() => formatCompactDate(invitation?.validFrom), [invitation]);
  const validUntilLabel = useMemo(() => formatCompactDate(invitation?.validUntil), [invitation]);

  const loadInvitation = async (targetId: string) => {
    if (targetId === 'demo') {
      const demo = buildDemoInvitation(targetId);
      setLoadError(null);
      setLocalInvitation(demo);
      setQrDataUrl(await buildQrPreviewDataUrl(demo.qrCode || demo.id));
      return;
    }

    try {
      const result = await invitationApi.execute('get', `/access-control/visit-invitations/${targetId}`);
      setLoadError(null);
      setLocalInvitation(null);
      if (result?.qrCode) {
        setQrDataUrl(await buildQrPreviewDataUrl(result.qrCode));
        return;
      }
      setQrDataUrl('');
    } catch (error: any) {
      setLocalInvitation(null);
      setQrDataUrl('');
      setLoadError(
        extractApiErrorMessage(error) ||
          'No fue posible cargar el pase solicitado. Verifica que el backend este activo y que la invitacion exista.',
      );
    }
  };

  const buildPassFile = async () => {
    if (!invitation || !qrDataUrl) {
      throw new Error('Pase incompleto');
    }

    const blob = await buildPassPngBlob({
      invitation,
      qrDataUrl,
      logoUrl,
      deviceImageUrl,
    });

    return new File([blob], `pase-completo-${invitationId}.png`, { type: 'image/png' });
  };

  const handleDownloadPassPng = async () => {
    try {
      setPngBusy(true);
      setShareStatus('');
      const file = await buildPassFile();
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      setShareStatus('Pase completo descargado en PNG');
    } catch {
      setShareStatus('No fue posible generar el PNG del pase');
    } finally {
      setPngBusy(false);
    }
  };

  const handleOpenEmailDialog = () => {
    setEmailTarget(invitation?.visitorEmail || '');
    setShareStatus('');
    setShowEmailDialog(true);
  };

  const handleCloseEmailDialog = () => {
    if (emailBusy) {
      return;
    }
    setShowEmailDialog(false);
  };

  const handleEmailShare = async () => {
    const targetEmail = emailTarget.trim();

    if (!invitation) {
      setShareStatus('No fue posible identificar el pase a enviar');
      return;
    }

    if (!targetEmail) {
      setShareStatus('Captura el correo destino antes de enviar');
      return;
    }

    try {
      setEmailBusy(true);
      setShareStatus('Enviando correo...');
      const result = await apiClient.post<SendVisitInvitationEmailResponse>(
        `/access-control/visit-invitations/${invitation.id}/send-email`,
        { email: targetEmail },
        { timeout: EMAIL_SEND_TIMEOUT_MS },
      );
      if (result.transportFallback) {
        setShareStatus(
          result.previewUrl
            ? `SMTP real no disponible. Se envio en modo prueba: ${result.previewUrl}`
            : 'SMTP real no disponible. Se envio en modo prueba (Ethereal).',
        );
      } else {
        setShareStatus(`Correo enviado a ${result.to}`);
      }
      setShowEmailDialog(false);
    } catch (error: any) {
      setShareStatus(extractApiErrorMessage(error) || 'No fue posible enviar el correo');
    } finally {
      setEmailBusy(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!invitation || !qrDataUrl) {
      return;
    }

    const whatsappText = [
      `ZIII Living | Pase para ${invitation.visitorName}`,
      `Vigencia: ${new Date(invitation.validFrom).toLocaleString('es-MX')} a ${new Date(invitation.validUntil).toLocaleString('es-MX')}.`,
      'Te comparto el PNG completo del pase para mostrarse en porteria.',
    ].join('\n');

    try {
      setPngBusy(true);
      setShareStatus('');
      const file = await buildPassFile();

      if (typeof navigator.share === 'function' && 'canShare' in navigator) {
        const canShareFiles = (navigator as Navigator & { canShare?: (data?: ShareData) => boolean }).canShare?.({
          files: [file],
        });

        if (canShareFiles) {
          await navigator.share({
            title: `Pase ZIII Living | ${invitation.visitorName}`,
            text: whatsappText,
            files: [file],
          });
          setShareStatus('Pase compartido desde el selector nativo del dispositivo');
          return;
        }
      }

      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);

      window.open(
        `https://web.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`,
        '_blank',
        'noopener,noreferrer',
      );
      setShareStatus(
        'Se descargo el PNG del pase y se abrio WhatsApp Web. Adjunta el archivo descargado en la conversacion.',
      );
    } catch {
      setShareStatus('No fue posible preparar el pase para WhatsApp');
    } finally {
      setPngBusy(false);
    }
  };

  if (!invitation && invitationApi.loading) {
    return (
      <div className="shareShell">
        <div className="shareFrame">
          <div className="shareEmpty">
            <h2>Cargando pase de visitante</h2>
            <p>Estamos preparando la vista movil del pase completo.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="shareShell">
        <div className="shareFrame">
          <div className="shareEmpty">
            <h2>Invitacion no encontrada</h2>
            <p>{loadError || 'No fue posible cargar el pase solicitado.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shareShell">
      {showEmailDialog ? (
        <div className="shareDialogOverlay" role="presentation" onClick={handleCloseEmailDialog}>
          <div
            className="shareDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-email-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shareDialogHeader">
              <div>
                <h3 id="share-email-dialog-title">Enviar pase por correo</h3>
                <p>Elige el correo destino antes de compartir este pase.</p>
              </div>
              <button
                className="shareDialogClose"
                type="button"
                onClick={handleCloseEmailDialog}
                disabled={emailBusy}
                aria-label="Cerrar cuadro de envio de correo"
              >
                x
              </button>
            </div>

            <label className="shareDialogField">
              <span>Correo destino</span>
              <input
                type="email"
                value={emailTarget}
                onChange={(event) => setEmailTarget(event.target.value)}
                placeholder="visitante@correo.com"
                autoFocus
              />
            </label>

            {shareStatus ? (
              <div className="shareDialogStatus" role="status" aria-live="polite">
                {shareStatus}
              </div>
            ) : null}

            <div className="shareDialogActions">
              <button
                className="btn btnGhost shareDialogButton"
                type="button"
                onClick={handleCloseEmailDialog}
                disabled={emailBusy}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary shareDialogButton"
                type="button"
                onClick={() => void handleEmailShare()}
                disabled={!emailTarget.trim() || emailBusy}
              >
                {emailBusy ? 'Enviando...' : 'Enviar correo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="shareFrame">
        <div className="shareTopbar">
          <div className="shareBrand">
            <img src={logo} alt="ZIII Living" />
            <div className="shareBadge">Pase listo para lector QR</div>
          </div>
          <div className="shareBadge">
            {invitation.status} · {validUntilLabel}
          </div>
        </div>

        <div className="shareGrid">
          <section className="shareHero">
            <div className="shareHeroContent">
              <div className="shareEyebrow">Pase ZIII Living</div>
              <h1 className="shareTitle">{invitation.visitorName}</h1>
              <p className="shareSubtitle">
                Muestra este pase completo en el celular del visitante.
              </p>

              <div className="shareDetails">
                <div className="shareDetailCard">
                  <div className="shareDetailLabel">Unidad</div>
                  <div className="shareDetailValue">{unitLabel}</div>
                </div>
                <div className="shareDetailCard">
                  <div className="shareDetailLabel">Motivo</div>
                  <div className="shareDetailValue">{shortText(invitation.purpose || 'Visita', 26)}</div>
                </div>
                <div className="shareDetailCard">
                  <div className="shareDetailLabel">Desde</div>
                  <div className="shareDetailValue">{validFromLabel}</div>
                </div>
                <div className="shareDetailCard">
                  <div className="shareDetailLabel">Hasta</div>
                  <div className="shareDetailValue">{validUntilLabel}</div>
                </div>
              </div>

              <div className="shareActionPanel">
                <div className="shareActionPanelTitle">Acciones</div>
                <div className="shareActionPanelText">
                  Descarga el pase completo o envialo por correo y WhatsApp.
                </div>

                <div className="shareActionRow">
                  <button
                    className="btn btn-primary shareMainButton"
                    type="button"
                    onClick={() => void handleDownloadPassPng()}
                    disabled={!qrDataUrl || pngBusy}
                  >
                    {pngBusy ? 'Preparando PNG...' : 'Descargar pase PNG'}
                  </button>
                  <button
                    className="btn btnGhost shareMainButton"
                    type="button"
                    onClick={handleOpenEmailDialog}
                    disabled={emailBusy}
                  >
                    Enviar por correo
                  </button>
                  <button
                    className="btn btnGhost shareMainButton"
                    type="button"
                    onClick={() => void handleWhatsAppShare()}
                    disabled={!qrDataUrl || pngBusy}
                  >
                    Enviar por WhatsApp
                  </button>
                </div>
              </div>

              {shareStatus && !showEmailDialog ? <div className="shareInlineStatus">{shareStatus}</div> : null}

              <div className="shareQuickNote">
                QR grande, brillo alto y sin recortes.
              </div>
            </div>
          </section>

          <section className="sharePhone">
            <div className="sharePhoneFrame sharePhoneFrameWide">
              <div className="sharePhoneScreen sharePhoneScreenWide">
                <div className="sharePhoneHeader">
                  <img src={logo} alt="ZIII Living" />
                  <div className="sharePhoneTime">LISTO PARA PORTERIA</div>
                </div>

                <div className="sharePassCard sharePassCardWide">
                  <div className="sharePassBanner">
                    <small>Visitante autorizado</small>
                    <h2>{invitation.visitorName}</h2>
                  </div>

                  <div className="sharePassBody sharePassBodyWide">
                    <div className="shareQrWrap shareQrWrapLarge">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR de acceso ZIII Living" />
                      ) : (
                        <div className="shareQrEmpty">QR pendiente</div>
                      )}
                    </div>

                    <div className="sharePassMeta sharePassMetaWide">
                      <div className="shareMetaTile">
                        <span>Acceso</span>
                        <strong>{accessLabel}</strong>
                      </div>
                      <div className="shareMetaTile">
                        <span>Desde</span>
                        <strong>{validFromLabel}</strong>
                      </div>
                      <div className="shareMetaTile">
                        <span>Hasta</span>
                        <strong>{validUntilLabel}</strong>
                      </div>
                      <div className="shareMetaTile shareMetaTileFull">
                        <span>Unidad</span>
                        <strong>{unitLabel}</strong>
                      </div>
                    </div>

                    <div className="shareHints shareHintsCompact">
                      <h3>LECTURA</h3>
                      <p>
                        MUESTRA EL PASE COMPLETO CON BRILLO ALTO.
                      </p>
                    </div>

                    <div className="shareDeviceGuide">
                      <div className="shareDeviceGuideText">
                        <strong>En el equipo Hikvision</strong>
                        <span>TOCA EL ICONO QR Y MUESTRA ESTE PASE.</span>
                      </div>
                      <div className="shareDeviceGuideArt">
                        <img src={hikvisionDevice} alt="Guia visual del lector Hikvision" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sharePreviewActions">
                  <button
                    className="btn btn-primary shareMainButton"
                    type="button"
                    onClick={() => void handleDownloadPassPng()}
                    disabled={!qrDataUrl || pngBusy}
                  >
                    Descargar pase
                  </button>
                  <button
                    className="btn btnGhost shareMainButton"
                    type="button"
                    onClick={() => void handleWhatsAppShare()}
                    disabled={!qrDataUrl || pngBusy}
                  >
                    WhatsApp
                  </button>
                  <button
                    className="btn btnGhost shareMainButton"
                    type="button"
                    onClick={handleOpenEmailDialog}
                    disabled={emailBusy}
                  >
                    Correo
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

function formatCompactDate(value?: string): string {
  if (!value) return 'Por definir';
  return new Date(value).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCompactUnitLabel(value?: string): string {
  if (!value) return 'Unidad';
  const text = String(value).trim();
  if (/^[0-9a-f]{8}-/i.test(text)) {
    return `Unidad ${text.slice(0, 8)}`;
  }
  return shortText(text, 26);
}

function formatCompactAccess(doors?: unknown): string {
  if (!Array.isArray(doors) || !doors.length) return 'Autorizado';
  return shortText(String(doors[0]), 30);
}

function shortText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function extractApiErrorMessage(error: any): string {
  const errorCode = String(error?.code || '').toUpperCase();
  const errorMessage = String(error?.message || '');
  if (errorCode === 'ECONNABORTED' || /timeout/i.test(errorMessage)) {
    return 'El servidor tardo demasiado en responder al envio de correo. Intenta de nuevo en unos segundos.';
  }

  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) {
    return apiMessage.join(', ');
  }
  if (typeof apiMessage === 'string') {
    return apiMessage;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return '';
}
