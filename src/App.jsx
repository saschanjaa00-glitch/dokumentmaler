import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import FullmaktPage from './pages/FullmaktPage'
import HiringPage from './pages/HiringPage'

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fullmakt" element={<FullmaktPage />} />
            <Route path="/ansettelse" element={<HiringPage />} />
            <Route path="/innstilling" element={<Navigate to="/ansettelse" replace />} />
            <Route path="/tilsettingsvedtak" element={<Navigate to="/ansettelse" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
