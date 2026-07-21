import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { apiClient } from '@/services/api-client';
import { PaymentRecord, Unit } from '@/types';
import '@/styles/list.css';

type PaymentFormState = {
  unitId: string;
  amount: string;
  paymentMethod: string;
  currency: string;
  transactionId: string;
  paymentProviderId: string;
  description: string;
};

const EMPTY_FORM: PaymentFormState = {
  unitId: '',
  amount: '',
  paymentMethod: 'bank_transfer',
  currency: 'MXN',
  transactionId: '',
  paymentProviderId: '',
  description: '',
};

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [unitFilter, setUnitFilter] = useState('');
  const [formData, setFormData] = useState<PaymentFormState>(EMPTY_FORM);

  useEffect(() => {
    void loadData();
  }, []);

  const summary = useMemo(() => {
    const approvedAmount = payments
      .filter((payment) => payment.status === 'approved')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return {
      approvedAmount: approvedAmount.toFixed(2),
      approvedCount: payments.filter((payment) => payment.status === 'approved').length,
      pendingCount: payments.filter((payment) => payment.status === 'pending' || payment.status === 'processing').length,
      failedCount: payments.filter((payment) => payment.status === 'failed').length,
    };
  }, [payments]);

  const loadData = async (filterValue?: string) => {
    const nextUnitFilter = filterValue ?? unitFilter;
    setLoading(true);
    setError(null);

    try {
      const query = nextUnitFilter ? `?unitId=${encodeURIComponent(nextUnitFilter)}` : '';
      const [paymentsData, unitsData] = await Promise.all([
        apiClient.get<PaymentRecord[]>(`/payments${query}`),
        apiClient.get<Unit[]>('/units'),
      ]);

      setPayments(paymentsData || []);
      setUnits(unitsData || []);
    } catch (err: any) {
      setError(extractApiErrorMessage(err) || 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/payments/manual', {
        unitId: formData.unitId,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        currency: formData.currency,
        transactionId: formData.transactionId || undefined,
        paymentProviderId: formData.paymentProviderId || undefined,
        description: formData.description || undefined,
      });

      setShowForm(false);
      setFormData(EMPTY_FORM);
      await loadData();
    } catch (err: any) {
      setError(extractApiErrorMessage(err) || 'No se pudo registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const unitNameById = (unitId: string) => units.find((unit) => unit.id === unitId)?.unitNumber || unitId;

  return (
    <Layout>
      <div className="page">
        <div className="pageHeader">
          <div>
            <h1 className="pageTitle">Pagos</h1>
            <p className="pageSubtitle">Registro de ingresos y conciliacion manual contra cuotas por unidad.</p>
          </div>
          <div className="pageActions">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Registrar pago
            </button>
          </div>
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        <div className="statsGrid" style={{ marginBottom: 8 }}>
          <div className="statCard">
            <div className="statLabel">Ingresos aprobados</div>
            <div className="statValue">${summary.approvedAmount}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Pagos aprobados</div>
            <div className="statValue">{summary.approvedCount}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Pendientes</div>
            <div className="statValue">{summary.pendingCount}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Fallidos</div>
            <div className="statValue">{summary.failedCount}</div>
          </div>
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filtrar por unidad</label>
            <select
              value={unitFilter}
              onChange={(e) => {
                const value = e.target.value;
                setUnitFilter(value);
                void loadData(value);
              }}
            >
              <option value="">Todas las unidades</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.unitNumber}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? <div className="loading">Cargando pagos…</div> : null}

        {payments.length ? (
          <div className="panel">
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Unidad</th>
                    <th>Monto</th>
                    <th>Metodo</th>
                    <th>Proveedor / Ref</th>
                    <th>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div className="cellStrong">{new Date(payment.createdAt).toLocaleString()}</div>
                        <div className="cellMuted">{payment.description || 'Sin descripcion'}</div>
                      </td>
                      <td>{unitNameById(payment.unitId)}</td>
                      <td>{payment.currency} ${Number(payment.amount).toFixed(2)}</td>
                      <td>{payment.paymentMethod}</td>
                      <td>
                        <div className="cellStrong">{payment.paymentProviderId || 'manual'}</div>
                        <div className="cellMuted">{payment.transactionId || 'sin referencia'}</div>
                      </td>
                      <td><span className="badge">{payment.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="emptyState">
              <div className="emptyTitle">No hay pagos registrados</div>
              <div className="emptyText">Registra el primer pago para activar conciliacion en cobranza.</div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>Registrar pago</button>
            </div>
          )
        )}
      </div>

      {showForm ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Registrar pago manual</div>
                <div className="modalSubtitle">El backend aplicara el monto a cuotas abiertas por antiguedad.</div>
              </div>
              <button className="btn btnGhost btnSmall" onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }}>
                Cerrar
              </button>
            </div>

            <form className="modalBody" onSubmit={handleSubmit}>
              <div className="formRow formRowTwo">
                <div className="form-group">
                  <label>Unidad</label>
                  <select value={formData.unitId} onChange={(e) => setFormData({ ...formData, unitId: e.target.value })} required>
                    <option value="">Selecciona una unidad</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.unitNumber}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Monto</label>
                  <input type="number" step="0.01" min="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
              </div>

              <div className="formRow formRowTwo">
                <div className="form-group">
                  <label>Metodo</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                    <option value="bank_transfer">Transferencia</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="check">Cheque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Moneda</label>
                  <input value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })} maxLength={3} required />
                </div>
              </div>

              <div className="formRow formRowTwo">
                <div className="form-group">
                  <label>Proveedor (opcional)</label>
                  <input value={formData.paymentProviderId} onChange={(e) => setFormData({ ...formData, paymentProviderId: e.target.value })} placeholder="mercado_pago" />
                </div>
                <div className="form-group">
                  <label>Referencia / Transaccion</label>
                  <input value={formData.transactionId} onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })} placeholder="TXN-2026-001" />
                </div>
              </div>

              <div className="formRow">
                <div className="form-group">
                  <label>Descripcion</label>
                  <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Pago parcial julio" />
                </div>
              </div>

              <div className="modalFooter">
                <button type="button" className="btn btnGhost" onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando…' : 'Registrar pago'}
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

