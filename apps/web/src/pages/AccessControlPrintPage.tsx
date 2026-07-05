import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import logo from '@/assets/ZIIILiving3.png';
import { useApi } from '@/hooks/useApi';
import { VisitInvitation } from '@/types';
import { buildDemoInvitation, buildQrPreviewDataUrl } from '@/utils/accessControlShare';
import '@/styles/access-control-share.css';

export const AccessControlPrintPage: React.FC = () => {
  const { id } = useParams();
  const invitationId = id || 'demo';
  const invitationApi = useApi<VisitInvitation>();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [localInvitation, setLocalInvitation] = useState<VisitInvitation | null>(null);

  useEffect(() => {
    void loadInvitation(invitationId);
  }, [invitationId]);

  const invitation = invitationApi.data || localInvitation;
  const doorsText = useMemo(() => {
    if (!Array.isArray(invitation?.metadata?.allowedDoors) || !invitation?.metadata?.allowedDoors.length) {
      return 'Acceso autorizado';
    }
    return invitation.metadata.allowedDoors.join(', ');
  }, [invitation]);

  const loadInvitation = async (targetId: string) => {
    if (targetId === 'demo') {
      const demo = buildDemoInvitation(targetId);
      setLocalInvitation(demo);
      setQrDataUrl(await buildQrPreviewDataUrl(demo.qrCode || demo.id));
      return;
    }

    try {
      const result = await invitationApi.execute('get', `/access-control/visit-invitations/${targetId}`);
      setLocalInvitation(null);
      if (!result?.qrCode) {
        setQrDataUrl('');
        return;
      }
      setQrDataUrl(await buildQrPreviewDataUrl(result.qrCode));
    } catch {
      const demo = buildDemoInvitation(targetId);
      setLocalInvitation(demo);
      setQrDataUrl(await buildQrPreviewDataUrl(demo.qrCode || demo.id));
    }
  };

  if (!invitation && invitationApi.loading) {
    return (
      <div className="shareShell">
        <div className="shareFrame">
          <div className="shareEmpty">
            <h2>Preparando formato imprimible</h2>
            <p>En cuanto cargue el pase, usa “Guardar como PDF” desde el diálogo de impresión.</p>
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
            <h2>Pase no encontrado</h2>
            <p>No fue posible cargar el documento solicitado.</p>
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
            <div className="shareBadge">Formato listo para PDF</div>
          </div>
          <div className="shareActionRow" style={{ marginTop: 0 }}>
            <button className="btn btn-primary" type="button" onClick={() => window.print()}>
              Guardar como PDF
            </button>
          </div>
        </div>

        <div className="shareEmailPreview" style={{ marginTop: 0 }}>
          <div
            style={{
              borderRadius: 30,
              overflow: 'hidden',
              background: '#ffffff',
              border: '1px solid rgba(9, 30, 66, 0.08)',
            }}
          >
            <div
              style={{
                padding: 28,
                background: 'linear-gradient(135deg, #082f49 0%, #0f766e 52%, #0ea5e9 100%)',
                color: '#ffffff',
              }}
            >
              <img src={logo} alt="ZIII Living" style={{ width: 140, height: 'auto', display: 'block' }} />
              <div style={{ marginTop: 18, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.8 }}>
                Pase de visitante
              </div>
              <h1 style={{ marginTop: 10, fontSize: 38, lineHeight: 1.02 }}>{invitation.visitorName}</h1>
              <p style={{ marginTop: 12, maxWidth: 520, fontSize: 16, lineHeight: 1.7, opacity: 0.9 }}>
                {invitation.purpose || 'Visita autorizada'}
              </p>
            </div>

            <div style={{ padding: 30 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
                <div
                  style={{
                    padding: 18,
                    borderRadius: 24,
                    border: '1px solid rgba(9, 30, 66, 0.08)',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f3f8fc 100%)',
                  }}
                >
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR de acceso"
                      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 18, background: '#fff', padding: 10 }}
                    />
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', lineHeight: 1.7, color: 'rgba(18,48,71,0.7)' }}>
                      QR pendiente
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  <div className="shareMetaTile">
                    <span>Unidad</span>
                    <strong>{String(invitation.metadata?.unitLabel || invitation.unitId)}</strong>
                  </div>
                  <div className="shareMetaTile">
                    <span>Accesos permitidos</span>
                    <strong>{doorsText}</strong>
                  </div>
                  <div className="shareMetaTile">
                    <span>Valido desde</span>
                    <strong>{new Date(invitation.validFrom).toLocaleString('es-MX')}</strong>
                  </div>
                  <div className="shareMetaTile">
                    <span>Valido hasta</span>
                    <strong>{new Date(invitation.validUntil).toLocaleString('es-MX')}</strong>
                  </div>
                  <div className="shareMetaTile">
                    <span>PIN de respaldo</span>
                    <strong>{invitation.pinCode || 'No configurado'}</strong>
                  </div>
                </div>
              </div>

              <div className="shareHints" style={{ marginTop: 22 }}>
                <h3>Uso recomendado</h3>
                <p>
                  Este formato esta optimizado para imprimirse o guardarse como PDF desde el navegador. Presenta el QR
                  completo y evita reducirlo demasiado para conservar la legibilidad en el lector.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
