import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { Organization } from '@/types';
import '@/styles/dashboard.css';

export const DashboardPage: React.FC = () => {
  const { data: organizations, execute } = useApi<Organization[]>();

  useEffect(() => {
    execute('get', '/organizations');
  }, [execute]);

  return (
    <Layout>
      <div className="dashboard">
        <h1>Dashboard</h1>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Organizaciones</h3>
            <p className="stat-number">{organizations?.length || 0}</p>
            <Link to="/organizations" className="link">
              Ver todas →
            </Link>
          </div>

          <div className="card">
            <h3>Propiedades</h3>
            <p className="stat-number">--</p>
            <Link to="/properties" className="link">
              Ver todas →
            </Link>
          </div>

          <div className="card">
            <h3>Unidades</h3>
            <p className="stat-number">--</p>
            <Link to="/units" className="link">
              Ver todas →
            </Link>
          </div>

          <div className="card">
            <h3>Cuotas Vencidas</h3>
            <p className="stat-number">--</p>
            <Link to="/quotas" className="link">
              Ver detalle →
            </Link>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Actividad Reciente</h2>
          <p className="placeholder">No hay actividad reciente</p>
        </div>
      </div>
    </Layout>
  );
};
