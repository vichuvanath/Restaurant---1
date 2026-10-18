import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ManagerLogin } from './pages/ManagerLogin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routed Endpoint: /manager/login */}
        <Route path="/manager/login" element={<ManagerLogin />} />

        {/* Redirect root / to /manager/login */}
        <Route path="/" element={<Navigate to="/manager/login" replace />} />

        {/* Catch-all redirect to /manager/login */}
        <Route path="*" element={<Navigate to="/manager/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
