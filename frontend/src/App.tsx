import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CustomerPortal } from './pages/CustomerPortal'
import { ManagerLogin } from './pages/ManagerLogin'
import { ManagerItems } from './pages/ManagerItems'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Ordering Portal at Root Endpoint: / */}
        <Route path="/" element={<CustomerPortal />} />

        {/* Manager Portal Endpoints */}
        <Route path="/manager/login" element={<ManagerLogin />} />
        <Route path="/manager/items" element={<ManagerItems />} />

        {/* Catch-all redirect to root / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
