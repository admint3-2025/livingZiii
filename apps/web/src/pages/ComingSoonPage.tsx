import React from 'react';
import { Layout } from '@/components/layout/Layout';

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ title, description }) => {
  return (
    <Layout>
      <div className="page">
        <div className="pageHeader">
          <div>
            <h1 className="pageTitle">{title}</h1>
            <p className="pageSubtitle">
              {description || 'Esta sección está en preparación. Lo siguiente será conectarla al backend y habilitar flujos reales.'}
            </p>
          </div>
        </div>

        <div className="emptyState">
          <div className="emptyTitle">En construcción</div>
          <div className="emptyText">
            Estamos priorizando primero lo esencial: organizaciones, propiedades, unidades, cobranza y accesos integrados.
          </div>
        </div>
      </div>
    </Layout>
  );
};

