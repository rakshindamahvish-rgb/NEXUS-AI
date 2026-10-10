import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ScenarioProvider } from './context/ScenarioContext';
import { Layout } from './components/Layout/Layout';

import { OverviewPage } from './pages/OverviewPage';
import { NetworkPage } from './pages/NetworkPage';
import { CrisisSimulatorPage } from './pages/CrisisSimulatorPage';
import { FutureLabPage } from './pages/FutureLabPage';
import { AgentOperationsPage } from './pages/AgentOperationsPage';
import { RecoveryPlansPage } from './pages/RecoveryPlansPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { DecisionHistoryPage } from './pages/DecisionHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <ScenarioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<OverviewPage />} />
            <Route path="network" element={<NetworkPage />} />
            <Route path="crisis-simulator" element={<CrisisSimulatorPage />} />
            <Route path="future-lab" element={<FutureLabPage />} />
            <Route path="agents" element={<AgentOperationsPage />} />
            <Route path="recovery-plans" element={<RecoveryPlansPage />} />
            <Route path="benchmarks" element={<BenchmarksPage />} />
            <Route path="data-explorer" element={<DataExplorerPage />} />
            <Route path="decision-history" element={<DecisionHistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ScenarioProvider>
  );
}

export default App;
