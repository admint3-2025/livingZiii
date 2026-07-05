import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import logo from '@/assets/ZIIILiving3.png';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/services/api-client';
import { SendVisitInvitationEmailResponse, VisitInvitation } from '@/types';
import {
  buildDemoInvitation,
  buildInvitationEmailHtml,
  buildQrPreviewDataUrl,
} from '@/utils/accessControlShare';
import '@/styles/access-control-share.css';

const EMAIL_SEND_TIMEOUT_MS = 45000;

export const AccessControlEmailPreviewPage: React.FC = () => {
  const { id } = useParams();
  const invitationId = id || 'demo';
  const invitationApi = useApi<VisitInvitation>();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [localInvitation, setLocalInvitation] = useState<VisitInvitation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void loadInvitation(invitationId);
  }, [invitationId]);

  const invitation = invitationApi.data || localInvitation;
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const shareUrl = useMemo(
    () => `${window.location.origin}/access-control/share/${invitationId}`,
    [invitationId],
  );
  const emailHtml = useMemo(() => {
    if (!invitation) {
      return '';
    }

    return buildInvitationEmailHtml({
      invitation,
      qrDataUrl,
      shareUrl,
      logoUrl: `${window.location.origin}${logo}`,
    });
  }, [invitation, qrDataUrl, shareUrl]);

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
      if (!result?.qrCode) {
        setQrDataUrl('');
        return;
      }
      setQrDataUrl(await buildQrPreviewDataUrl(result.qrCode));
    } catch (error: any) {
      setLocalInvitation(null);
      setQrDataUrl('');
      setLoadError(
        extractApiErrorMessage(error) ||
          'No fue posible cargar la invitacion. Verifica que el pase exista y que el backend este activo.',
      );
    }
  };

  const handleSendEmail = async () => {
    if (!invitation?.visitorEmail) {
      setEmailStatus('No hay correo configurado para esta invitacion');
      return;
    }

    setEmailStatus('Enviando correo...');
    try {
      const result = await apiClient.post<SendVisitInvitationEmailResponse>(
        `/access-control/visit-invitations/${invitation.id}/send-email`,
        { email: invitation.visitorEmail },
        { timeout: EMAIL_SEND_TIMEOUT_MS },
      );
      if (result.transportFallback) {
        setEmailStatus(
          result.previewUrl
            ? `SMTP real no disponible. Se envio en modo prueba: ${result.previewUrl}`
            : 'SMTP real no disponible. Se envio en modo prueba (Ethereal).',
        );
      } else {
        setEmailStatus(`Correo enviado a ${result.to}`);
      }
    } catch (err: any) {
      setEmailStatus(extractApiErrorMessage(err) || 'Error al enviar el correo');
    }
  };

  if (!invitation && invitationApi.loading) {
    return (
      <div className="shareShell">
        <div className="shareFrame">
          <div className="shareEmpty">
            <h2>Preparando correo</h2>
            <p>Estamos armando la vista previa con el QR y el branding de ZIII Living.</p>
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
            <p>{loadError || 'No fue posible cargar la invitacion solicitada.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shareShell">
      <div className="shareFrame">
        <div className="shareTopbar">
          <div className="shareBrand">
            <img src={logo} alt="ZIII Living" />
            <div className="shareBadge">Vista previa de correo</div>
          </div>
          <div className="shareActionRow" style={{ marginTop: 0 }}>
            <button className="btn btnGhost" type="button" onClick={handleSendEmail} disabled={!invitation}>
              Enviar por correo
            </button>
            <button className="btn btn-primary" type="button" onClick={() => window.print()} disabled={!invitation}>
              Imprimir / PDF
            </button>
          </div>
        </div>
        {emailStatus ? (
          <div style={{ marginTop: 12, fontSize: 14, color: '#0f766e' }}>{emailStatus}</div>
        ) : null}

        <div className="sharePreviewFrame" style={{ minHeight: 720 }}>
          <iframe title="Vista previa del correo de visitante" srcDoc={emailHtml} style={{ minHeight: 720, width: '100%', border: 'none' }} />
        </div>
      </div>
    </div>
  );
};

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
