const { buildRouter } = require('./_crud');

module.exports = buildRouter({
  table: 'finance_ledger',
  entityKey: 'ledger',
  columns: ['ledger_id', 'holder', 'transaction', 'debit_credits', 'credit_credits', 'balance_credits', 'ts'],
  orderBy: 'ts',
});
