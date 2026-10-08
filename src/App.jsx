import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Welcome from './mvp/Welcome'
import Shell from './mvp/Shell'
import Dashboard from './mvp/pages/Dashboard'
import InvoicePage from './mvp/pages/InvoicePage'
import CreatePage from './mvp/pages/CreatePage'
import Payments from './mvp/pages/Payments'
import Parties from './mvp/pages/Parties'
import Disputes from './mvp/pages/Disputes'
import Profile from './mvp/pages/Profile'
import { InvoicesPage, RequestsPage, NotesPage, InventoryPage, ReturnsPage } from './mvp/pages/ListPages'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/app" element={<Welcome />} />
      <Route path="/app/:role" element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoicePage />} />
        <Route path="new" element={<CreatePage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="disputes" element={<Disputes />} />
        <Route path="payments" element={<Payments />} />
        <Route path="parties" element={<Parties />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
