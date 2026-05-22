// Default to backend on 3051 (matches .env), allow override via env or window.
const API_BASE =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  'http://localhost:3051/api';

function getToken() { return localStorage.getItem('cr_token'); }
function setToken(token) { if (token) localStorage.setItem('cr_token', token); else localStorage.removeItem('cr_token'); }

function getHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(url, options = {}) {
  const isForm = options.body instanceof FormData;
  const headers = isForm
    ? { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...(options.headers || {}) }
    : { ...getHeaders(), ...(options.headers || {}) };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    setToken(null);
    localStorage.removeItem('cr_user');
    if (typeof window !== 'undefined' && window.location && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Auth
export const login = async (email, password) => {
  const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (data && data.token) {
    setToken(data.token);
    if (data.user) localStorage.setItem('cr_user', JSON.stringify(data.user));
  }
  return data;
};
export const logout = () => { setToken(null); localStorage.removeItem('cr_user'); };
export const getMe = () => request('/auth/me');
export const isAuthenticated = () => Boolean(getToken());
export const currentUser = () => { try { return JSON.parse(localStorage.getItem('cr_user') || 'null'); } catch (e) { return null; } };

// Dashboard
export const getDashboardStats = () => request('/dashboard/stats');

// Generic CRUD factory
const crud = (path) => ({
  list:   () => request(path),
  get:    (id) => request(`${path}/${id}`),
  create: (data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`${path}/${id}`, { method: 'DELETE' }),
});

// Original 8
export const projectsApi      = crud('/projects');
export const creditsApi       = crud('/credits');
export const holdersApi       = crud('/holders');
export const verifiersApi     = crud('/verifiers');
export const transactionsApi  = crud('/transactions');
export const auditsApi        = crud('/audits');
export const methodologiesApi = crud('/methodologies');
export const issuancesApi     = crud('/issuances');

// New 10
export const retirementsApi             = crud('/retirements');
export const beneficiariesApi           = crud('/beneficiaries');
export const scopesEmissionsApi         = crud('/scopes-emissions');
export const scoreboardApi              = crud('/scoreboard');
export const jurisdictionalBaselinesApi = crud('/jurisdictional-baselines');
export const satelliteImageryApi        = crud('/satellite-imagery');
export const smrReportsApi              = crud('/smr-reports');
export const claimsApi                  = crud('/claims');
export const biodiversityCobenefitsApi  = crud('/biodiversity-cobenefits');
export const financeLedgerApi           = crud('/finance-ledger');

// Back-compat shims (still used by older pages)
export const getProjects      = projectsApi.list;
export const createProject    = projectsApi.create;
export const updateProject    = projectsApi.update;
export const deleteProject    = projectsApi.remove;
export const getCredits       = creditsApi.list;
export const createCredit     = creditsApi.create;
export const updateCredit     = creditsApi.update;
export const deleteCredit     = creditsApi.remove;
export const getHolders       = holdersApi.list;
export const createHolder     = holdersApi.create;
export const updateHolder     = holdersApi.update;
export const deleteHolder     = holdersApi.remove;
export const getVerifiers     = verifiersApi.list;
export const createVerifier   = verifiersApi.create;
export const updateVerifier   = verifiersApi.update;
export const deleteVerifier   = verifiersApi.remove;
export const getTransactions  = transactionsApi.list;
export const createTransaction= transactionsApi.create;
export const updateTransaction= transactionsApi.update;
export const deleteTransaction= transactionsApi.remove;
export const getAudits        = auditsApi.list;
export const createAudit      = auditsApi.create;
export const updateAudit      = auditsApi.update;
export const deleteAudit      = auditsApi.remove;
export const getMethodologies = methodologiesApi.list;
export const createMethodology= methodologiesApi.create;
export const updateMethodology= methodologiesApi.update;
export const deleteMethodology= methodologiesApi.remove;
export const getIssuances     = issuancesApi.list;
export const createIssuance   = issuancesApi.create;
export const updateIssuance   = issuancesApi.update;
export const deleteIssuance   = issuancesApi.remove;

// AI (16 total)
export const aiVerifyProject        = (project) => request('/ai/verify-project',        { method: 'POST', body: JSON.stringify({ project }) });
export const aiSynthesizeMRV        = (project) => request('/ai/synthesize-mrv',        { method: 'POST', body: JSON.stringify({ project }) });
export const aiDetectFraud          = (transaction) => request('/ai/detect-fraud',      { method: 'POST', body: JSON.stringify({ transaction }) });
export const aiAnalyzePricing       = (project_type, vintage) => request('/ai/analyze-pricing', { method: 'POST', body: JSON.stringify({ project_type, vintage }) });
export const aiMapMethodology       = (project) => request('/ai/map-methodology',       { method: 'POST', body: JSON.stringify({ project }) });
export const aiDraftDisclosure      = (holder) => request('/ai/draft-disclosure',       { method: 'POST', body: JSON.stringify({ holder }) });
export const aiLeakageModeler       = (project) => request('/ai/leakage-modeler',       { method: 'POST', body: JSON.stringify({ project }) });
export const aiSatelliteMRV         = (project, imagery_period) => request('/ai/satellite-mrv', { method: 'POST', body: JSON.stringify({ project, imagery_period }) });
export const aiDoubleCountingDetect = (credit) => request('/ai/double-counting-detect', { method: 'POST', body: JSON.stringify({ credit }) });
export const aiAdditionalityScorer  = (project) => request('/ai/additionality-scorer',  { method: 'POST', body: JSON.stringify({ project }) });
export const aiRegistryArbitrage    = (project_type) => request('/ai/registry-arbitrage', { method: 'POST', body: JSON.stringify({ project_type }) });
export const aiPriceDiscovery       = (project_type, vintage) => request('/ai/price-discovery', { method: 'POST', body: JSON.stringify({ project_type, vintage }) });
export const aiBiodiversityCoBenefit= (project) => request('/ai/biodiversity-co-benefit',{ method: 'POST', body: JSON.stringify({ project }) });
export const aiClimateClaimValidator= (claim) => request('/ai/climate-claim-validator', { method: 'POST', body: JSON.stringify({ claim }) });
export const aiSupplyCapForecast    = (project_type) => request('/ai/supply-cap-forecast', { method: 'POST', body: JSON.stringify({ project_type }) });
export const aiScope3Attributor     = (holder) => request('/ai/scope-3-attributor',     { method: 'POST', body: JSON.stringify({ holder }) });

// AI — Pass 7 (full backlog)
export const aiMrvDocumentValidate       = (mrv_document, methodology) => request('/ai/mrv-document-validate', { method: 'POST', body: JSON.stringify({ mrv_document, methodology }) });
export const aiNarrativeEvidenceReconcile = (narrative, evidence) => request('/ai/narrative-evidence-reconcile', { method: 'POST', body: JSON.stringify({ narrative, evidence }) });
export const aiAmlScreenTransaction      = (transaction) => request('/ai/aml-screen-transaction', { method: 'POST', body: JSON.stringify({ transaction }) });
export const aiProjectRating             = (project) => request('/ai/project-rating', { method: 'POST', body: JSON.stringify({ project }) });
export const draftRetirementCertificatePack = (body) => request('/retirement-certificate-pack/draft', { method: 'POST', body: JSON.stringify(body || {}) });

// Registry interop (NEEDS-CREDS stubs — return 503 until configured)
export const registryInteropStatus = () => request('/ai/registry-interop/status');
export const registryInteropSync   = (registry, body = {}) =>
  request(`/ai/registry-interop/${registry}/sync`, { method: 'POST', body: JSON.stringify(body) });

// Pass 7 CRUD APIs
export const correspondingAdjustmentsApi = crud('/corresponding-adjustments');
export const projectRatingsApi           = crud('/project-ratings');

// Issuance hash-chain
export const issuanceChainList   = () => request('/issuance-chain');
export const issuanceChainHead   = () => request('/issuance-chain/head');
export const issuanceChainSeal   = () => request('/issuance-chain/seal', { method: 'POST', body: JSON.stringify({}) });
export const issuanceChainVerify = () => request('/issuance-chain/verify');

// Public retirement lookup (no auth)
const PUBLIC_API_BASE = API_BASE.replace(/\/api$/, '/api');
export const publicRetirementLookup = async (serial) => {
  const res = await fetch(`${PUBLIC_API_BASE}/public/retirements/${encodeURIComponent(serial)}`);
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};
export const publicRetirementSearch = async (beneficiary, limit = 25) => {
  const qs = new URLSearchParams();
  if (beneficiary) qs.set('beneficiary', beneficiary);
  if (limit) qs.set('limit', String(limit));
  const res = await fetch(`${PUBLIC_API_BASE}/public/retirements?${qs.toString()}`);
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

// AI history
export const aiHistory = (feature) => {
  const qs = feature ? `?feature=${encodeURIComponent(feature)}` : '';
  return request(`/ai/history${qs}`);
};

// AI samples — returns { feature, samples: [{ label, values: { fieldKey: value, ... } }, ...] }
export const aiSamples = (feature) =>
  request(`/ai/samples?feature=${encodeURIComponent(feature)}`);

// Notifications
export const getNotifications        = () => request('/notifications');
export const getUnreadNotifications  = () => request('/notifications/unread/count');
export const markNotificationRead    = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead= () => request('/notifications/read-all', { method: 'POST' });

// Attachments
export const listAttachments = (entity_type, entity_id) => {
  const qs = entity_type && entity_id ? `?entity_type=${encodeURIComponent(entity_type)}&entity_id=${encodeURIComponent(entity_id)}` : '';
  return request(`/attachments${qs}`);
};
export const uploadAttachment = (file, entity_type, entity_id) => {
  const fd = new FormData();
  fd.append('file', file);
  if (entity_type) fd.append('entity_type', entity_type);
  if (entity_id) fd.append('entity_id', entity_id);
  return request('/attachments', { method: 'POST', body: fd });
};
export const downloadAttachmentUrl = (id) => `${API_BASE}/attachments/${id}/download`;
export const deleteAttachment = (id) => request(`/attachments/${id}`, { method: 'DELETE' });

// Webhooks
export const listWebhooks    = () => request('/webhooks');
export const createWebhook   = (data) => request('/webhooks', { method: 'POST', body: JSON.stringify(data) });
export const deleteWebhook   = (id) => request(`/webhooks/${id}`, { method: 'DELETE' });
export const webhookDeliveries = () => request('/webhooks/deliveries/log');
export const testWebhook     = (event, payload) => request('/webhooks/test', { method: 'POST', body: JSON.stringify({ event, payload }) });

// Bulk import
export const bulkImport = (entity, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return request(`/bulk-import/${entity}`, { method: 'POST', body: fd });
};
