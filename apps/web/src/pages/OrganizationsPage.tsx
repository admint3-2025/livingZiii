import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { Organization } from '@/types';
import '@/styles/list.css';

export const OrganizationsPage: React.FC = () => {
  const { data: organizations, loading, error, execute } = useApi<Organization[]>();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    execute('get', '/organizations');
  }, [execute]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await execute('post', '/organizations', formData);
      setFormData({ name: '', email: '', phone: '' });
      setShowForm(false);
      // Refresh list
      execute('get', '/organizations');
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <Layout>
      <div className="page">
        <div className="pageHeader">
          <div>
            <h1 className="pageTitle">Organizaciones</h1>
            <p className="pageSubtitle">Gestiona empresas administradoras y sus datos fiscales (opcional).</p>
          </div>
          <div className="pageActions">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Nueva organización
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && <div className="loading">Cargando...</div>}

        {organizations && organizations.length > 0 ? (
          <div className="panel">
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th style={{ width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id}>
                      <td className="cellStrong">{org.name}</td>
                      <td>{org.email || <span className="cellMuted">—</span>}</td>
                      <td>{org.phone || <span className="cellMuted">—</span>}</td>
                      <td>
                        <span className={`badge badge-${org.status}`}>{org.status}</span>
                      </td>
                      <td>
                        <button className="btn btnGhost btnSmall" disabled title="Edición detallada: próximamente">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="emptyState">
              <div className="emptyTitle">Aún no tienes organizaciones</div>
              <div className="emptyText">
                Crea tu primera organización para empezar a configurar propiedades, unidades y cobranza.
              </div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                Crear organización
              </button>
            </div>
          )
        )}
      </div>

      {showForm && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Nueva organización</div>
                <div className="modalSubtitle">Nombre, contacto y datos opcionales.</div>
              </div>
              <button className="btn btnGhost btnSmall" onClick={() => setShowForm(false)}>
                Cerrar
              </button>
            </div>

            <form className="modalBody" onSubmit={handleCreate}>
              <div className="formRow">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. ZIII Administraciones"
                    required
                  />
                </div>
              </div>

              <div className="formRow formRowTwo">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+52 33 0000 0000"
                  />
                </div>
              </div>

              <div className="modalFooter">
                <button type="button" className="btn btnGhost" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando…' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
