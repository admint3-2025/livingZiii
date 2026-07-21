import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { apiClient } from '@/services/api-client';
import { Property, Quota, Unit } from '@/types';
import '@/styles/list.css';

type QuotaFormState = {
  unitId: string;
  propertyId: string;
  type: 'ordinary' | 'extraordinary';
  amount: string;
  dueDate: string;
  description: string;
};

type QuotaFilters = {
  propertyId: string;
  unitId: string;
  status: '' | Quota['status'];
  type: '' | Quota['type'];
};

const EMPTY_FORM: QuotaFormState = {
  unitId: '',
  propertyId: '',
  type: 'ordinary',
  amount: '',
  dueDate: '',
  description: '',
};

export const QuotasPage: React.FC = () => {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<QuotaFilters>({ propertyId: '', unitId: '', status: '', type: '' });
  const [formData, setFormData] = useState<QuotaFormState>(EMPTY_FORM);

  useEffect(() => {
    void loadData();
  }, []);

  const summary = useMemo(() => {
    const total = quotas.reduce((sum, quota) => sum + Number(quota.amount || 0), 0);
    const paid = quotas.reduce((sum, quota) => sum + Number(quota.paidAmount || 0), 0);
    const overdue = quotas.filter((quota) => quota.status === 'overdue').length;
    const open = quotas.filter((quota) => ['pending', 'partial', 'overdue'].includes(quota.status)).length;

    return {
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      overdue,
      open,
    };
  }, [quotas]);

  const loadData = async (nextFilters?: QuotaFilters) => {
    const activeFilters = nextFilters ?? filters;
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      if (activeFilters.propertyId) {
        query.set('propertyId', activeFilters.propertyId);
      }
      if (activeFilters.unitId) {
        query.set('unitId', activeFilters.unitId);
      }
      if (activeFilters.status) {
        query.set('status', activeFilters.status);
      }
      if (activeFilters.type) {
        query.set('type', activeFilters.type);
      }

      const [quotasData, propertiesData, unitsData] = await Promise.all([
        apiClient.get<Quota[]>(`/financial/quotas${query.toString() ? `?${query.toString()}` : ''}`),
        apiClient.get<Property[]>('/properties'),
        apiClient.get<Unit[]>('/units'),
      ]);

      setQuotas(quotasData || []);
      setProperties(propertiesData || []);
      setUnits(unitsData || []);
    } catch (err: any) {
      setError(extractApiErrorMessage(err) || 'No se pudieron cargar las cuotas');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (patch: Partial<QuotaFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    void loadData(next);
  };

  const handleUnitChange = (unitId: string) => {
    const unit = units.find((candidate) => candidate.id === unitId);

    setFormData((prev) => ({
      ...prev,
      unitId,
      propertyId: unit ? unit.propertyId : prev.propertyId,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/financial/quotas', {
        unitId: formData.unitId,
        propertyId: formData.propertyId,
        type: formData.type,
        amount: Number(formData.amount),
        dueDate: formData.dueDate,
        description: formData.description || undefined,
      });

      setShowForm(false);
      setFormData(EMPTY_FORM);
      await loadData();
    } catch (err: any) {
      setError(extractApiErrorMessage(err) || 'No se pudo crear la cuota');
    } finally {
      setLoading(false);
    }
  };

  const unitById = (unitId: string) => units.find((unit) => unit.id === unitId)?.unitNumber || unitId;
  const propertyById = (propertyId: string) => properties.find((property) => property.id === propertyId)?.name || propertyId;

  return (
    <Layout>
      <div className="page">
        <div className="pageHeader">
          <div>
            <h1 className="pageTitle">Cuotas</h1>
            <p className="pageSubtitle">Genera cuotas y da seguimiento a pendientes, vencidas y pagadas.</p>
          </div>
          <div className="pageActions">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Nueva cuota
            </button>
          </div>
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        <div className="statsGrid" style={{ marginBottom: 8 }}>
          <div className="statCard">
            <div className="statLabel">Monto total</div>
            <div className="statValue">${summary.total}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Pagado</div>
            <div className="statValue">${summary.paid}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Abiertas</div>
            <div className="statValue">{summary.open}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Vencidas</div>
            <div className="statValue">{summary.overdue}</div>
          </div>
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="formRow formRowTwo" style={{ marginBottom: 0 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Propiedad</label>
              <select value={filters.propertyId} onChange={(e) => handleFilterChange({ propertyId: e.target.value })}>
                <option value="">Todas</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>{property.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Unidad</label>
              <select value={filters.unitId} onChange={(e) => handleFilterChange({ unitId: e.target.value })}>
                <option value="">Todas</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.unitNumber}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="formRow formRowTwo" style={{ marginTop: 12, marginBottom: 0 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Estatus</label>
              <select value={filters.status} onChange={(e) => handleFilterChange({ status: e.target.value as QuotaFilters['status'] })}>
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="partial">Parcial</option>
                <option value="paid">Pagada</option>
                <option value="overdue">Vencida</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tipo</label>
              <select value={filters.type} onChange={(e) => handleFilterChange({ type: e.target.value as QuotaFilters['type'] })}>
                <option value="">Todos</option>
                <option value="ordinary">Ordinaria</option>
                <option value="extraordinary">Extraordinaria</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? <div className="loading">Cargando cuotas…</div> : null}

        {quotas.length ? (
          <div className="panel">
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Propiedad</th>
                    <th>Unidad</th>
                    <th>Monto</th>
                    <th>Pagado</th>
                    <th>Vence</th>
                    <th>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {quotas.map((quota) => (
                    <tr key={quota.id}>
                      <td>
                        <div className="cellStrong">{quota.quotaNumber}</div>
                        <div className="cellMuted">{quota.type === 'ordinary' ? 'Ordinaria' : 'Extraordinaria'}</div>
                      </td>
                      <td>{propertyById(quota.propertyId)}</td>
                      <td>{unitById(quota.unitId)}</td>
                      <td>${Number(quota.amount).toFixed(2)}</td>
                      <td>${Number(quota.paidAmount).toFixed(2)}</td>
                      <td>{new Date(quota.dueDate).toLocaleDateString()}</td>
                      <td><span className="badge">{quota.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="emptyState">
              <div className="emptyTitle">No hay cuotas registradas</div>
              <div className="emptyText">Crea la primera cuota para empezar el flujo de cobranza.</div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>Crear cuota</button>
            </div>
          )
        )}
      </div>

      {showForm ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Nueva cuota</div>
                <div className="modalSubtitle">Alta individual para cobranza por unidad.</div>
              </div>
              <button className="btn btnGhost btnSmall" onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }}>
                Cerrar
              </button>
            </div>

            <form className="modalBody" onSubmit={handleSubmit}>
              <div className="formRow formRowTwo">
                <div className="form-group">
                  <label>Unidad</label>
                  <select value={formData.unitId} onChange={(e) => handleUnitChange(e.target.value)} required>
                    <option value="">Selecciona una unidad</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.unitNumber}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Propiedad</label>
                  <select value={formData.propertyId} onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })} required>
                    <option value="">Selecciona una propiedad</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>{property.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="formRow formRowTwo">
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as QuotaFormState['type'] })}>
                    <option value="ordinary">Ordinaria</option>
                    <option value="extraordinary">Extraordinaria</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Monto</label>
                  <input type="number" step="0.01" min="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
              </div>

              <div className="formRow formRowTwo">
                <div className="form-group">
                  <label>Fecha de vencimiento</label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Descripcion</label>
                  <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Mantenimiento julio 2026" />
                </div>
              </div>

              <div className="modalFooter">
                <button type="button" className="btn btnGhost" onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando…' : 'Crear cuota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

function extractApiErrorMessage(error: any): string | null {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return typeof error?.message === 'string' ? error.message : null;
}

