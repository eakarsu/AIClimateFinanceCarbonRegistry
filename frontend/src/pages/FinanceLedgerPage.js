import React from 'react';
import CrudPage from '../components/CrudPage';
import { financeLedgerApi } from '../services/api';

const columns = [
  { key: 'ledger_id', label: 'Ledger ID' },
  { key: 'holder', label: 'Holder' },
  { key: 'transaction', label: 'Transaction' },
  { key: 'debit_credits', label: 'Debit', format: 'number' },
  { key: 'credit_credits', label: 'Credit', format: 'number' },
  { key: 'balance_credits', label: 'Balance', format: 'number' },
  { key: 'ts', label: 'When', format: 'date' },
];

const fields = [
  { key: 'ledger_id', label: 'Ledger ID', required: true },
  { key: 'holder', label: 'Holder', required: true },
  { key: 'transaction', label: 'Transaction ref' },
  { key: 'debit_credits', label: 'Debit Credits', type: 'number' },
  { key: 'credit_credits', label: 'Credit Credits', type: 'number' },
  { key: 'balance_credits', label: 'Balance Credits', type: 'number' },
];

const defaults = { ledger_id: '', holder: '', transaction: '', debit_credits: 0, credit_credits: 0, balance_credits: 0 };

export default function FinanceLedgerPage() {
  return (
    <CrudPage
      title="Finance Ledger"
      subtitle="Double-entry credit ledger per holder, per transaction."
      columns={columns}
      fields={fields}
      api={{ list: financeLedgerApi.list, create: financeLedgerApi.create, update: financeLedgerApi.update, remove: financeLedgerApi.remove }}
      defaults={defaults}
    />
  );
}
