import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Jobs } from './pages/Jobs'
import { JobDetail } from './pages/JobDetail'
import { CandidatePool } from './pages/CandidatePool'
import { Settings } from './pages/Settings'

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/candidates" element={<CandidatePool />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppLayout>
  )
}

export default App
