import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import FullmaktPage from './pages/FullmaktPage'
import InnstillingPage from './pages/InnstillingPage'
import TilsettingsvedtakPage from './pages/TilsettingsvedtakPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fullmakt" element={<FullmaktPage />} />
            <Route path="/innstilling" element={<InnstillingPage />} />
            <Route path="/tilsettingsvedtak" element={<TilsettingsvedtakPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
