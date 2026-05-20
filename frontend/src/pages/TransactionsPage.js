import React from 'react';
import CrudPage from '../components/CrudPage';
import * as api from '../services/api';

const columns = [
  { key: 'transaction_id', label: 'TX ID' },
  { key: 'from_holder', label: 'From' },
  { key: 'to_holder', label: 'To' },
  { key: 'credits_amount', label: 'Credits', format: 'number' },
  { key: 'price_per_ton_usd', label: '$/tCO2e', format: 'currency' },
  { key: 'status', label: 'Status' },
  { key: 'occurred_at', label: 'Occurred', format: 'date' },
];

const fields = [
  { key: 'transaction_id', label: 'Transaction ID', required: true },
  { key: 'from_holder', label: 'From Holder' },
  { key: 'to_holder', label: 'To Holder' },
  { key: 'credits_amount', label: 'Credits Amount', type: 'number', required: true },
  { key: 'price_per_ton_usd', label: 'Price per Ton (USD)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'settled', 'failed'] },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

const defaults = { transaction_id: '', from_holder: '', to_holder: '', credits_amount: 0, price_per_ton_usd: 0, status: 'pending', notes: '' };

export default function TransactionsPage() {
  return (
    <CrudPage
      title="Transactions"
      subtitle="Credit transfers between holders with prices and settlement statuses."
      columns={columns}
      fields={fields}
      api={{ list: api.getTransactions, create: api.createTransaction, update: api.updateTransaction, remove: api.deleteTransaction }}
      defaults={defaults}
      statusFields={['status']}
    />
  );
}
