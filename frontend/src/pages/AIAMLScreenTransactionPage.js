import React from 'react';
import AIPage from '../components/AIPage';
import { aiAmlScreenTransaction } from '../services/api';

const fields = [
  { key: 'transaction_id', label: 'Transaction ID', required: true, placeholder: 'TX-2025-11789' },
  { key: 'from_holder', label: 'From Holder', required: true, placeholder: 'Andes Reforestation S.A.C.' },
  { key: 'to_holder', label: 'To Holder', required: true, placeholder: 'Eurasian Carbon Exchange' },
  { key: 'from_country', label: 'From Country', placeholder: 'Peru' },
  { key: 'to_country', label: 'To Country', placeholder: 'Russia' },
  { key: 'credits_amount', label: 'Credits Amount (tCO2e)', type: 'number' },
  { key: 'price_per_ton_usd', label: 'Price per Ton (USD)', type: 'number' },
  { key: 'payment_route_jurisdictions', label: 'Payment Route (comma-separated jurisdictions)', placeholder: 'Latvia, UAE, Cyprus' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

function asArray(s) {
  if (Array.isArray(s)) return s;
  if (s == null || s === '') return [];
  return String(s).split(',').map((x) => x.trim()).filter(Boolean);
}

export default function AIAMLScreenTransactionPage() {
  return (
    <AIPage
      title="AI AML / Sanctions Screening"
      subtitle="OFAC / UN / EU / PEP screening + wash-trading / layering / shell-buyer typology detection on credit transfers."
      fields={fields}
      buildPayload={(v) => ({
        transaction: {
          ...v,
          payment_route_jurisdictions: asArray(v.payment_route_jurisdictions),
        },
      })}
      runAI={({ transaction }) => aiAmlScreenTransaction(transaction)}
      examplePrompt="Describe a transaction. AI returns AML risk score + sanctions hits + typology flags."
      feature="aml-screen-transaction"
    />
  );
}
