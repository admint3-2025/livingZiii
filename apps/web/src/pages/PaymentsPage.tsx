import React from 'react';
import { ComingSoonPage } from './ComingSoonPage';

export const PaymentsPage: React.FC = () => {
  return (
    <ComingSoonPage
      title="Pagos"
      description="Registro de ingresos y conciliación. Próximo: integración con proveedor (Mercado Pago / Stripe) vía webhooks."
    />
  );
};

