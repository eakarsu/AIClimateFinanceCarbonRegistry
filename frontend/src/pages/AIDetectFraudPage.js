import React from 'react';
import AIPage from '../components/AIPage';
import { aiDetectFraud } from '../services/api';

const fields = [
  { key: 'transaction_id', label: 'Transaction ID', required: true, placeholder: 'TX-0099' },
  { key: 'from_holder', label: 'From Holder', placeholder: 'EcoTrade Capital' },
  { key: 'to_holder', label: 'To Holder', placeholder: 'Jane Doe' },
  { key: 'credits_amount', label: 'Credits Amount (tCO2e)', type: 'number' },
  { key: 'price_per_ton_usd', label: 'Price per Ton (USD)', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true, placeholder: 'Counterparty flagged on KYC; serial-number gap detected…' },
];

export default function AIDetectFraudPage() {
  return (
    <AIPage
      title="AI Detect Fraud"
      subtitle="Score transaction fraud risk, surface anomaly signals, KYC flags, and double-counting risks."
      fields={fields}
      buildPayload={(v) => v}
      runAI={(transaction) => aiDetectFraud(transaction)}
      examplePrompt="Describe a transaction. AI returns risk score, anomaly signals, recommended action."
      feature="detect-fraud"
    />
  );
}
