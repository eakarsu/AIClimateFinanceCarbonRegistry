import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

// Original CRUD pages
import ProjectsPage from './pages/ProjectsPage';
import CreditsPage from './pages/CreditsPage';
import HoldersPage from './pages/HoldersPage';
import VerifiersPage from './pages/VerifiersPage';
import TransactionsPage from './pages/TransactionsPage';
import AuditsPage from './pages/AuditsPage';
import MethodologiesPage from './pages/MethodologiesPage';
import IssuancesPage from './pages/IssuancesPage';

// New CRUD pages
import RetirementsPage from './pages/RetirementsPage';
import BeneficiariesPage from './pages/BeneficiariesPage';
import ScopesEmissionsPage from './pages/ScopesEmissionsPage';
import ScoreboardPage from './pages/ScoreboardPage';
import JurisdictionalBaselinesPage from './pages/JurisdictionalBaselinesPage';
import SatelliteImageryPage from './pages/SatelliteImageryPage';
import SMRReportsPage from './pages/SMRReportsPage';
import ClaimsPage from './pages/ClaimsPage';
import BiodiversityCoBenefitsPage from './pages/BiodiversityCoBenefitsPage';
import FinanceLedgerPage from './pages/FinanceLedgerPage';

// AI pages (original 6)
import AIVerifyProjectPage from './pages/AIVerifyProjectPage';
import AISynthesizeMRVPage from './pages/AISynthesizeMRVPage';
import AIDetectFraudPage from './pages/AIDetectFraudPage';
import AIAnalyzePricingPage from './pages/AIAnalyzePricingPage';
import AIMapMethodologyPage from './pages/AIMapMethodologyPage';
import AIDraftDisclosurePage from './pages/AIDraftDisclosurePage';

// AI pages (10 new)
import AILeakageModelerPage from './pages/AILeakageModelerPage';
import AISatelliteMRVPage from './pages/AISatelliteMRVPage';
import AIDoubleCountingDetectPage from './pages/AIDoubleCountingDetectPage';
import AIAdditionalityScorerPage from './pages/AIAdditionalityScorerPage';
import AIRegistryArbitragePage from './pages/AIRegistryArbitragePage';
import AIPriceDiscoveryPage from './pages/AIPriceDiscoveryPage';
import AIBiodiversityCoBenefitPage from './pages/AIBiodiversityCoBenefitPage';
import AIClimateClaimValidatorPage from './pages/AIClimateClaimValidatorPage';
import AISupplyCapForecastPage from './pages/AISupplyCapForecastPage';
import AIScope3AttributorPage from './pages/AIScope3AttributorPage';

// Cross-cutting pages
import NotificationsPage from './pages/NotificationsPage';
import WebhooksPage from './pages/WebhooksPage';
import BulkImportPage from './pages/BulkImportPage';

// Custom Climate Views (4 features)
import CustomViewsPage from './pages/CustomViewsPage';

import LoginPage from './pages/LoginPage';
import { isAuthenticated } from './services/api';
import './App.css';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function Shell({ children, sidebarOpen, setSidebarOpen }) {
  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <button
        className="sidebar-toggle"
        aria-label="Toggle navigation"
        onClick={() => setSidebarOpen((v) => !v)}
      >
        ☰
      </button>
      <Sidebar onNavigate={() => setSidebarOpen(false)} />
      <main className="main">{children}</main>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}

function AppRoutes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Shell sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <Routes>
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />

        <Route path="/projects" element={<RequireAuth><ProjectsPage /></RequireAuth>} />
        <Route path="/credits" element={<RequireAuth><CreditsPage /></RequireAuth>} />
        <Route path="/holders" element={<RequireAuth><HoldersPage /></RequireAuth>} />
        <Route path="/verifiers" element={<RequireAuth><VerifiersPage /></RequireAuth>} />
        <Route path="/transactions" element={<RequireAuth><TransactionsPage /></RequireAuth>} />
        <Route path="/audits" element={<RequireAuth><AuditsPage /></RequireAuth>} />
        <Route path="/methodologies" element={<RequireAuth><MethodologiesPage /></RequireAuth>} />
        <Route path="/issuances" element={<RequireAuth><IssuancesPage /></RequireAuth>} />

        <Route path="/retirements" element={<RequireAuth><RetirementsPage /></RequireAuth>} />
        <Route path="/beneficiaries" element={<RequireAuth><BeneficiariesPage /></RequireAuth>} />
        <Route path="/scopes-emissions" element={<RequireAuth><ScopesEmissionsPage /></RequireAuth>} />
        <Route path="/scoreboard" element={<RequireAuth><ScoreboardPage /></RequireAuth>} />
        <Route path="/jurisdictional-baselines" element={<RequireAuth><JurisdictionalBaselinesPage /></RequireAuth>} />
        <Route path="/satellite-imagery" element={<RequireAuth><SatelliteImageryPage /></RequireAuth>} />
        <Route path="/smr-reports" element={<RequireAuth><SMRReportsPage /></RequireAuth>} />
        <Route path="/claims" element={<RequireAuth><ClaimsPage /></RequireAuth>} />
        <Route path="/biodiversity-cobenefits" element={<RequireAuth><BiodiversityCoBenefitsPage /></RequireAuth>} />
        <Route path="/finance-ledger" element={<RequireAuth><FinanceLedgerPage /></RequireAuth>} />

        <Route path="/ai/verify-project" element={<RequireAuth><AIVerifyProjectPage /></RequireAuth>} />
        <Route path="/ai/synthesize-mrv" element={<RequireAuth><AISynthesizeMRVPage /></RequireAuth>} />
        <Route path="/ai/detect-fraud" element={<RequireAuth><AIDetectFraudPage /></RequireAuth>} />
        <Route path="/ai/analyze-pricing" element={<RequireAuth><AIAnalyzePricingPage /></RequireAuth>} />
        <Route path="/ai/map-methodology" element={<RequireAuth><AIMapMethodologyPage /></RequireAuth>} />
        <Route path="/ai/draft-disclosure" element={<RequireAuth><AIDraftDisclosurePage /></RequireAuth>} />

        <Route path="/ai/leakage-modeler" element={<RequireAuth><AILeakageModelerPage /></RequireAuth>} />
        <Route path="/ai/satellite-mrv" element={<RequireAuth><AISatelliteMRVPage /></RequireAuth>} />
        <Route path="/ai/double-counting-detect" element={<RequireAuth><AIDoubleCountingDetectPage /></RequireAuth>} />
        <Route path="/ai/additionality-scorer" element={<RequireAuth><AIAdditionalityScorerPage /></RequireAuth>} />
        <Route path="/ai/registry-arbitrage" element={<RequireAuth><AIRegistryArbitragePage /></RequireAuth>} />
        <Route path="/ai/price-discovery" element={<RequireAuth><AIPriceDiscoveryPage /></RequireAuth>} />
        <Route path="/ai/biodiversity-co-benefit" element={<RequireAuth><AIBiodiversityCoBenefitPage /></RequireAuth>} />
        <Route path="/ai/climate-claim-validator" element={<RequireAuth><AIClimateClaimValidatorPage /></RequireAuth>} />
        <Route path="/ai/supply-cap-forecast" element={<RequireAuth><AISupplyCapForecastPage /></RequireAuth>} />
        <Route path="/ai/scope-3-attributor" element={<RequireAuth><AIScope3AttributorPage /></RequireAuth>} />

        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/webhooks" element={<RequireAuth><WebhooksPage /></RequireAuth>} />
        <Route path="/bulk-import" element={<RequireAuth><BulkImportPage /></RequireAuth>} />

        <Route path="/custom-views" element={<RequireAuth><CustomViewsPage /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Shell>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
