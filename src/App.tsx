import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { StockPage } from './pages/StockPage'
import { ClientsPage } from './pages/ClientsPage'
import { SalesPage } from './pages/SalesPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { ReturnsPage } from './pages/ReturnsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
