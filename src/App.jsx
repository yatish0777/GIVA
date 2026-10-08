import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import AppPage from './pages/AppPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
