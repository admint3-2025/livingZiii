import React from 'react';
import { Link } from 'react-router-dom';
import '@/styles/list.css';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="emptyState" style={{ maxWidth: 560 }}>
        <div className="emptyTitle">Acceso denegado</div>
        <div className="emptyText">
          No tienes permisos para ver esta sección. Si crees que es un error, solicita a tu administrador que te asigne el rol correcto.
        </div>
        <Link to="/dashboard" className="btn btn-primary">
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
};

