import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import {
  AccessControlDemoContext,
  AccessControlPass,
  AccessControlProviderSummary,
  CreateVisitInvitationRequest,
  CreateVisitInvitationResponse,
  SendVisitInvitationEmailResponse,
  VisitInvitation,
} from '@/types';
import { apiClient } from '@/services/api-client';
import { buildInvitationEmailHtml, buildQrPreviewDataUrl, buildShareMessage } from '@/utils/accessControlShare';
import logo from '@/assets/ZIIILiving3.png';
import '@/styles/list.css';
import './AccessControlPage.css';

const DEFAULT_PROVIDER = 'hikvision';
const ACCESS_USAGE_OPTIONS = {
  single_entry: 1,
  entry_and_exit: 2,
  multi_use: 20,
} as const;

type AccessUsageMode = keyof typeof ACCESS_USAGE_OPTIONS;
type AccessConcessionMode = 'vehicular_entry_exit' | 'pedestrian_entry_exit';
const ACCESS_CONCESSION_OPTIONS: Record<AccessConcessionMode, string[]> = {
  vehicular_entry_exit: ['Entrada y salida vehicular'],
  pedestrian_entry_exit: ['Entrada y salida peatonal'],
};
const EMAIL_SEND_TIMEOUT_MS = 45000;

export const AccessControlPage: React.FC = () => {
  const providersApi = useApi<AccessControlProviderSummary[]>();
  const invitationsApi = useApi<VisitInvitation[]>();
  const createApi = useApi<CreateVisitInvitationResponse>();
  const providerStatusApi = useApi<{ connected: boolean; message?: string }>();
  const demoContextApi = useApi<AccessControlDemoContext>();

  const [providers, setProviders] = useState<AccessControlProviderSummary[]>([]);
  const [invitations, setInvitations] = useState<VisitInvitation[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [selectedPass, setSelectedPass] = useState<AccessControlPass | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<VisitInvitation | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [lastShareText, setLastShareText] = useState('');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [selectedInvitationIds, setSelectedInvitationIds] = useState<string[]>([]);
  const [accessConcessionMode, setAccessConcessionMode] = useState<AccessConcessionMode>('vehicular_entry_exit');
  const [accessUsageMode, setAccessUsageMode] = useState<AccessUsageMode>('entry_and_exit');
  const [demoContext, setDemoContext] = useState<AccessControlDemoContext | null>(null);
  const [formData, setFormData] = useState<CreateVisitInvitationRequest>({
    propertyId: '',
    unitId: '',
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    purpose: '',
    createdBy: '',
    accessControlProviderId: DEFAULT_PROVIDER,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    allowedDoors: ACCESS_CONCESSION_OPTIONS.vehicular_entry_exit,
    maxEntries: ACCESS_USAGE_OPTIONS.entry_and_exit,
    metadata: {},
  });

  useEffect(() => {
    void loadProviders();
    void loadInvitations();
    void loadProviderStatus(DEFAULT_PROVIDER);
    void loadDemoContext();
  }, []);

  const activeProviderLabel = useMemo(() => {
    return providers.find((provider) => provider.id === formData.accessControlProviderId)?.name ?? 'Hikvision';
  }, [providers, formData.accessControlProviderId]);
  const publicShareUrl = useMemo(() => {
    return shareUrl ? `${window.location.origin}${shareUrl}` : '';
  }, [shareUrl]);
  const emailHtml = useMemo(() => {
    if (!selectedInvitation || !publicShareUrl) {
      return '';
    }

    return buildInvitationEmailHtml({
      invitation: selectedInvitation,
      qrDataUrl,
      shareUrl: publicShareUrl,
      logoUrl: `${window.location.origin}${logo}`,
    });
  }, [publicShareUrl, qrDataUrl, selectedInvitation]);

  const loadProviders = async () => {
    try {
      const result = await providersApi.execute('get', '/access-control/providers');
      setProviders(result);
    } catch {
      setProviders([{ id: DEFAULT_PROVIDER, name: 'Hikvision Access Control' }]);
    }
  };

  const loadInvitations = async () => {
    try {
      const result = await invitationsApi.execute('get', '/access-control/visit-invitations');
      setInvitations(result || []);
    } catch {
      setInvitations([]);
    }
  };

  const loadProviderStatus = async (providerId: string) => {
    try {
      await providerStatusApi.execute('get', `/access-control/providers/${providerId}/status`);
    } catch {
      // Hook state already captures the message for the UI.
    }
  };

  const loadDemoContext = async () => {
    try {
      const result = await demoContextApi.execute('get', '/access-control/demo-context');
      setDemoContext(result);
      setFormData((current) => ({
        ...current,
        propertyId: result.property.id,
        unitId: result.unit.id,
        createdBy: result.resident.id,
      }));
    } catch {
      setDemoContext(null);
    }
  };

  const handleSendEmail = async (invitation: VisitInvitation) => {
    if (!invitation.visitorEmail) {
      setEmailStatus('El pase no tiene correo de destino');
      return;
    }

    try {
      setEmailStatus('Enviando correo...');
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

  const handleDownloadInvitationQr = async (invitation: VisitInvitation) => {
    if (!invitation.qrCode) return;

    const url = await buildQrPreviewDataUrl(invitation.qrCode);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-visita-${invitation.id}.png`;
    link.click();
  };

  const handleOpenRowShare = (invitation: VisitInvitation) => {
    window.open(`${window.location.origin}/access-control/share/${invitation.id}`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenRowEmailPreview = (invitation: VisitInvitation) => {
    window.open(`${window.location.origin}/access-control/share/${invitation.id}/email`, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteInvitation = async (invitation: VisitInvitation) => {
    const confirmed = window.confirm(
      `Eliminar el pase de ${invitation.visitorName}? Tambien se revocara en Hik-Connect si sigue activo.`,
    );
    if (!confirmed) return;

    try {
      setDeleteStatus('Eliminando pase...');
      await apiClient.delete(`/access-control/visit-invitations/${invitation.id}`);
      setDeleteStatus(`Pase eliminado: ${invitation.visitorName}`);

      if (selectedInvitation?.id === invitation.id) {
        setSelectedInvitation(null);
        setSelectedPass(null);
        setShareUrl('');
        setQrDataUrl('');
        setLastShareText('');
      }

      await loadInvitations();
    } catch (err: any) {
      setDeleteStatus(err.response?.data?.message || 'No se pudo eliminar el pase');
    }
  };

  const handleToggleInvitationSelection = (invitationId: string) => {
    setSelectedInvitationIds((current) =>
      current.includes(invitationId) ? current.filter((id) => id !== invitationId) : [...current, invitationId],
    );
  };

  const handleToggleAllInvitations = () => {
    setSelectedInvitationIds((current) =>
      current.length === invitations.length ? [] : invitations.map((invitation) => invitation.id),
    );
  };

  const handleDeleteSelectedInvitations = async () => {
    if (!selectedInvitationIds.length) {
      return;
    }

    const selectedNames = invitations
      .filter((invitation) => selectedInvitationIds.includes(invitation.id))
      .map((invitation) => invitation.visitorName);
    const confirmed = window.confirm(
      `Eliminar ${selectedInvitationIds.length} pase(s): ${selectedNames.join(', ')}? Tambien se revocaran en Hik-Connect si siguen activos.`,
    );
    if (!confirmed) return;

    try {
      setDeleteStatus(`Eliminando ${selectedInvitationIds.length} pase(s)...`);

      for (const invitationId of selectedInvitationIds) {
        await apiClient.delete(`/access-control/visit-invitations/${invitationId}`);
      }

      if (selectedInvitation && selectedInvitationIds.includes(selectedInvitation.id)) {
        setSelectedInvitation(null);
        setSelectedPass(null);
        setShareUrl('');
        setQrDataUrl('');
        setLastShareText('');
      }

      setDeleteStatus(`${selectedInvitationIds.length} pase(s) eliminados`);
      setSelectedInvitationIds([]);
      await loadInvitations();
    } catch (err: any) {
      setDeleteStatus(err.response?.data?.message || 'No se pudieron eliminar los pases seleccionados');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const allowedDoors = ACCESS_CONCESSION_OPTIONS[accessConcessionMode];

    const payload: CreateVisitInvitationRequest = {
      ...formData,
      allowedDoors,
      maxEntries: ACCESS_USAGE_OPTIONS[accessUsageMode],
      metadata: {
        ...(formData.metadata || {}),
        source: 'web',
        qrMode: 'native-hikvision',
        comment: formData.metadata?.comment || '',
        accessUsageMode,
        accessProfile: accessConcessionMode,
      },
    };

    const result = await createApi.execute('post', '/access-control/visit-invitations', payload);
    setSelectedPass(result.pass);
    setSelectedInvitation(result.invitation);
    setShareUrl(result.share.shareUrl);
    setLastShareText(buildShareMessage(result.invitation, `${window.location.origin}${result.share.shareUrl}`));
    setEmailStatus(null);

    if (result.pass.qrCode) {
      setQrDataUrl(await buildQrPreviewDataUrl(result.pass.qrCode));
    } else if (result.invitation.qrCode) {
      setQrDataUrl(await buildQrPreviewDataUrl(result.invitation.qrCode));
    } else {
      setQrDataUrl('');
    }

    await loadInvitations();
  };

  const handleGenerateQrPreview = async () => {
    if (!selectedPass?.qrCode) return;
    setQrDataUrl(await buildQrPreviewDataUrl(selectedPass.qrCode));
  };

  const handleCopyShare = async () => {
    const text = `${lastShareText}\n${window.location.origin}${shareUrl}`;
    await navigator.clipboard.writeText(text);
  };

  const handleOpenShareView = () => {
    if (!shareUrl) return;
    window.open(`${window.location.origin}${shareUrl}`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenEmailPreview = () => {
    if (!shareUrl) return;
    window.open(`${window.location.origin}${shareUrl}/email`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenPrintPreview = () => {
    if (!shareUrl) return;
    window.open(`${window.location.origin}${shareUrl}/print`, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadEmailHtml = () => {
    if (!emailHtml || !selectedInvitation) return;

    const blob = new Blob([emailHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `correo-pase-${selectedInvitation.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-visita-${selectedPass?.id || 'ziii'}.png`;
    link.click();
  };

  const handleClear = () => {
    setAccessConcessionMode('vehicular_entry_exit');
    setAccessUsageMode('entry_and_exit');
    setFormData({
      propertyId: demoContext?.property.id ?? '',
      unitId: demoContext?.unit.id ?? '',
      visitorName: '',
      visitorPhone: '',
      visitorEmail: '',
      purpose: '',
      createdBy: demoContext?.resident.id ?? '',
      accessControlProviderId: DEFAULT_PROVIDER,
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      allowedDoors: ACCESS_CONCESSION_OPTIONS.vehicular_entry_exit,
      maxEntries: ACCESS_USAGE_OPTIONS.entry_and_exit,
      metadata: {},
    });
  };

  return (
    <Layout>
      <div className="page">
        <div className="pageHeader">
          <div>
            <h1 className="pageTitle">Control de acceso</h1>
            <p className="pageSubtitle">
              Genera pases temporales alineados con Hik-Connect Teams para que el residente comparta el QR o la
              referencia nativa cuando OpenAPI quede habilitado.
            </p>
          </div>
        </div>

        {createApi.error && <div className="error-message">{createApi.error}</div>}
        {deleteStatus ? <div className={deleteStatus.startsWith('No se') ? 'error-message' : 'success-message'}>{deleteStatus}</div> : null}

        <div className="panel" style={{ padding: 18 }}>
          <div className="formRow formRowTwo">
            <div>
              <div className="cellStrong" style={{ marginBottom: 8 }}>
                Estado del proveedor
              </div>
              <div className="emptyText">
                Proveedor activo: <strong>{activeProviderLabel}</strong>. El backend ya distingue entre modo
                `device` y modo `team`.
              </div>
              {providerStatusApi.data?.message ? (
                <div className="emptyText" style={{ marginTop: 8 }}>
                  Estado actual: {providerStatusApi.data.message}
                </div>
              ) : null}
              {demoContext ? (
                <div className="emptyText" style={{ marginTop: 8 }}>
                  Contexto demo: <strong>{demoContext.organization.name}</strong> /{' '}
                  <strong>{demoContext.property.name}</strong> / <strong>{demoContext.unit.unitNumber}</strong> /{' '}
                  <strong>{demoContext.resident.name}</strong>
                </div>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
              <button className="btn btnGhost btnSmall" type="button" onClick={loadProviders}>
                Refrescar proveedores
              </button>
              <button
                className="btn btnGhost btnSmall"
                type="button"
                onClick={() => loadProviderStatus(formData.accessControlProviderId)}
              >
                Revisar estado
              </button>
              <button className="btn btnGhost btnSmall" type="button" onClick={loadInvitations}>
                Refrescar bitacora
              </button>
              <button className="btn btnGhost btnSmall" type="button" onClick={loadDemoContext}>
                Recargar demo
              </button>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 18 }}>
          <div className="pageHeader" style={{ marginBottom: 14, alignItems: 'center' }}>
            <div>
              <div className="modalTitle">Nuevo pase temporal</div>
              <div className="modalSubtitle">
                Replica el flujo de Hik-Connect Teams: nombre, concesion de acceso, pases permitidos y vigencia.
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div className="formRow formRowTwo">
              <div className="form-group">
                <label>Nombre del visitante</label>
                <input
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                  placeholder="Ej. Juan Perez"
                  required
                />
              </div>
              <div className="form-group">
                <label>Proveedor</label>
                <select
                  value={formData.accessControlProviderId}
                  onChange={(e) => {
                    const providerId = e.target.value;
                    setFormData({ ...formData, accessControlProviderId: providerId });
                    void loadProviderStatus(providerId);
                  }}
                >
                  {(providers.length ? providers : [{ id: DEFAULT_PROVIDER, name: 'Hikvision Access Control' }]).map(
                    (provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="formRow formRowTwo">
              <div className="form-group">
                <label>Telefono</label>
                <input
                  value={formData.visitorPhone || ''}
                  onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                  placeholder="+52..."
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.visitorEmail || ''}
                  onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                  placeholder="visitante@mail.com"
                />
              </div>
            </div>

            <div className="formRow">
              <div className="form-group">
                <label>Concesion de acceso</label>
                <select
                  value={accessConcessionMode}
                  onChange={(e) => {
                    const mode = e.target.value as AccessConcessionMode;
                    setAccessConcessionMode(mode);
                    setFormData({
                      ...formData,
                      allowedDoors: ACCESS_CONCESSION_OPTIONS[mode],
                    });
                  }}
                >
                  <option value="vehicular_entry_exit">Entrada y salida vehicular</option>
                  <option value="pedestrian_entry_exit">Entrada y salida peatonal</option>
                </select>
                <div className="cellMuted" style={{ marginTop: 6, fontSize: 12 }}>
                  Esta opcion es descriptiva para el residente y la bitacora. La autorizacion real usa el perfil
                  Hikvision predeterminado configurado en el sistema.
                </div>
              </div>
            </div>

            <div className="formRow formRowTwo">
              <div className="form-group">
                <label>Uso del QR</label>
                <select
                  value={accessUsageMode}
                  onChange={(e) => {
                    const mode = e.target.value as AccessUsageMode;
                    setAccessUsageMode(mode);
                    setFormData({
                      ...formData,
                      maxEntries: ACCESS_USAGE_OPTIONS[mode],
                    });
                  }}
                >
                  <option value="single_entry">Solo entrada</option>
                  <option value="entry_and_exit">Entrada y salida</option>
                  <option value="multi_use">Multiuso durante vigencia</option>
                </select>
                <div className="cellMuted" style={{ marginTop: 6, fontSize: 12 }}>
                  {accessUsageMode === 'single_entry'
                    ? 'Permite una sola apertura.'
                    : accessUsageMode === 'entry_and_exit'
                      ? 'Permite una apertura de entrada y otra de salida.'
                      : 'Permite multiples aperturas durante la vigencia del pase.'}
                </div>
              </div>
              <div className="form-group">
                <label>Motivo</label>
                <input
                  value={formData.purpose || ''}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Entrega, visita familiar, mantenimiento..."
                />
              </div>
            </div>

            <div className="formRow formRowTwo">
              <div className="form-group">
                <label>Valido desde</label>
                <input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Valido hasta</label>
                <input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="formRow formRowTwo">
              <div className="form-group">
                <label>Comentario</label>
                <input
                  value={String(formData.metadata?.comment || '')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metadata: { ...(formData.metadata || {}), comment: e.target.value },
                    })
                  }
                  placeholder="Ubicacion de puertas, observaciones, etc."
                />
              </div>
              <div className="form-group">
                <label>Residente que comparte</label>
                <input
                  value={demoContext ? `${demoContext.resident.name} · ${demoContext.unit.unitNumber}` : 'Cargando contexto demo...'}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btnGhost" onClick={handleClear}>
                Limpiar
              </button>
              <button type="submit" className="btn btn-primary" disabled={createApi.loading}>
                {createApi.loading ? 'Generando QR...' : 'Generar pase temporal'}
              </button>
            </div>
          </form>
        </div>

        <div className="panel" style={{ padding: 18 }}>
          <div className="pageHeader" style={{ marginBottom: 14, alignItems: 'center' }}>
            <div>
              <div className="modalTitle">Ultimo QR generado</div>
              <div className="modalSubtitle">Vista compartible y descargable para el residente.</div>
            </div>
          </div>

          {selectedPass ? (
            <div className="formRow formRowTwo" style={{ alignItems: 'start' }}>
              <div className="emptyState" style={{ alignItems: 'stretch' }}>
                <div className="emptyTitle">{selectedInvitation?.visitorName ?? selectedPass?.id}</div>
                {selectedInvitation ? (
                  <>
                    <div className="emptyText">Estado: {selectedInvitation.status}</div>
                    <div className="emptyText">Valido desde: {new Date(selectedInvitation.validFrom).toLocaleString()}</div>
                    <div className="emptyText">Valido hasta: {new Date(selectedInvitation.validUntil).toLocaleString()}</div>
                    <div className="emptyText">Compartir: {shareUrl || 'Pendiente'}</div>
                  </>
                ) : (
                  <>
                    <div className="emptyText">Estado: {selectedPass.status}</div>
                    <div className="emptyText">Valido desde: {new Date(selectedPass.validFrom).toLocaleString()}</div>
                    <div className="emptyText">Valido hasta: {new Date(selectedPass.validUntil).toLocaleString()}</div>
                    <div className="emptyText">Compartir: {shareUrl || 'Pendiente'}</div>
                  </>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" type="button" onClick={handleGenerateQrPreview}>
                    Previsualizar QR
                  </button>
                  <button className="btn btnGhost" type="button" onClick={handleCopyShare}>
                    Copiar enlace
                  </button>
                  <button className="btn btnGhost" type="button" onClick={handleOpenShareView} disabled={!shareUrl}>
                    Abrir vista movil
                  </button>
                  <button className="btn btnGhost" type="button" onClick={handleOpenEmailPreview} disabled={!shareUrl}>
                    Vista previa correo
                  </button>
                  <button className="btn btnGhost" type="button" onClick={handleOpenPrintPreview} disabled={!shareUrl}>
                    PDF / imprimir
                  </button>
                  <button className="btn btnGhost" type="button" onClick={handleDownload}>
                    Descargar PNG
                  </button>
                  <button className="btn btnGhost" type="button" onClick={handleDownloadEmailHtml} disabled={!emailHtml}>
                    Descargar HTML correo
                  </button>
                </div>
                <div className="cellMuted" style={{ fontSize: 12 }}>
                  {lastShareText}
                </div>
                {emailStatus ? (
                  <div className="cellText" style={{ marginTop: 8, fontSize: 13 }}>
                    {emailStatus}
                  </div>
                ) : null}
              </div>

              <div className="emptyState" style={{ alignItems: 'center', justifyContent: 'center' }}>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR de invitacion"
                    style={{ width: 280, height: 280, borderRadius: 16, background: '#fff', padding: 12 }}
                  />
                ) : (
                  <>
                    <div className="emptyTitle">QR pendiente</div>
                    <div className="emptyText">
                      Cuando Hikvision retorne el QR nativo, lo veremos aqui para compartirlo o descargarlo.
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="emptyState">
              <div className="emptyTitle">Aun no hay QR generado</div>
              <div className="emptyText">
                Crea un pase temporal arriba y aqui aparecera el QR nativo o la referencia que devuelva Hikvision.
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="accessTableToolbar">
            <div>
              <div className="accessTableTitle">Pases generados</div>
              <div className="accessTableMeta">
                {selectedInvitationIds.length
                  ? `${selectedInvitationIds.length} seleccionados`
                  : `${invitations.length} registros en la vista`}
              </div>
            </div>
            <div className="accessTableActions">
              <button
                className="btn btnGhost accessMiniButton"
                type="button"
                onClick={() => setSelectedInvitationIds([])}
                disabled={!selectedInvitationIds.length}
              >
                Limpiar seleccion
              </button>
              <button
                className="btn btnGhost accessMiniButton accessDangerButton"
                type="button"
                onClick={() => void handleDeleteSelectedInvitations()}
                disabled={!selectedInvitationIds.length}
              >
                Eliminar seleccionados
              </button>
            </div>
          </div>
          <div className="tableWrap">
            <table className="accessInvitationsTable">
              <thead>
                <tr>
                  <th className="accessCheckboxCol">
                    <input
                      type="checkbox"
                      checked={Boolean(invitations.length) && selectedInvitationIds.length === invitations.length}
                      onChange={handleToggleAllInvitations}
                      aria-label="Seleccionar todos los pases"
                    />
                  </th>
                  <th>Visitante</th>
                  <th>Unidad</th>
                  <th>Pases</th>
                  <th>Estado</th>
                  <th>Vigencia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr
                    key={invitation.id}
                    className={
                      selectedInvitation?.id === invitation.id || selectedInvitationIds.includes(invitation.id)
                        ? 'rowSelected'
                        : ''
                    }
                  >
                    <td className="accessCheckboxCol">
                      <input
                        type="checkbox"
                        checked={selectedInvitationIds.includes(invitation.id)}
                        onChange={() => handleToggleInvitationSelection(invitation.id)}
                        aria-label={`Seleccionar pase de ${invitation.visitorName}`}
                      />
                    </td>
                    <td>
                      <div className="accessVisitorCell">
                        <div className="cellStrong">{invitation.visitorName}</div>
                        <div className="cellMuted accessRowSubline">
                          {invitation.visitorEmail || invitation.visitorPhone || 'Sin contacto'}
                        </div>
                      </div>
                    </td>
                    <td className="accessUnitCell">
                      <div>{demoContext?.unit.id === invitation.unitId ? demoContext.unit.unitNumber : invitation.unitId}</div>
                      <div className="cellMuted accessRowSubline">{invitation.unitId}</div>
                    </td>
                    <td>{String(invitation.metadata?.maxEntries ?? '-')}</td>
                    <td>
                      <span className={`badge accessStatusBadge badge-${invitation.status === 'approved' ? 'active' : 'inactive'}`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="accessValidityCell">
                      <div>{new Date(invitation.validFrom).toLocaleDateString()}</div>
                      <div className="cellMuted accessRowSubline">{new Date(invitation.validUntil).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div className="accessActionGrid">
                        <button
                          className="btn btnGhost accessMiniButton"
                          type="button"
                          onClick={() => handleOpenRowShare(invitation)}
                        >
                          Ver pase
                        </button>
                        <button className="btn btnGhost accessMiniButton" type="button" onClick={() => handleOpenRowShare(invitation)}>
                          Abrir
                        </button>
                        <button
                          className="btn btnGhost accessMiniButton"
                          type="button"
                          onClick={() => handleOpenRowEmailPreview(invitation)}
                        >
                          Vista correo
                        </button>
                        <button
                          className="btn btnGhost accessMiniButton"
                          type="button"
                          onClick={() => void handleDownloadInvitationQr(invitation)}
                          disabled={!invitation.qrCode}
                        >
                          Descargar QR
                        </button>
                        <button
                          className="btn btnGhost accessMiniButton"
                          type="button"
                          onClick={() => void handleSendEmail(invitation)}
                          disabled={!invitation.visitorEmail}
                        >
                          Enviar correo
                        </button>
                        <button
                          className="btn btnGhost accessMiniButton accessDangerButton"
                          type="button"
                          onClick={() => void handleDeleteInvitation(invitation)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!invitations.length ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="emptyState" style={{ margin: 14 }}>
                        <div className="emptyTitle">Sin invitaciones todavia</div>
                        <div className="emptyText">
                          Cuando generes el primer pase temporal, aqui veras el historial reciente.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
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
