import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { I18nProvider } from './i18n'
import LangSwitcher from './components/LangSwitcher'
import CreateQueue from './pages/CreateQueue'
import OperatorBoard from './pages/OperatorBoard'
import JoinQueue from './pages/JoinQueue'
import TicketStatus from './pages/TicketStatus'
import DevTools from './pages/DevTools'

export default function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <LangSwitcher />
        <Routes>
          <Route path="/" element={<Navigate to="/op/new" replace />} />
          <Route path="/op/new" element={<CreateQueue />} />
          <Route path="/op/:secret" element={<OperatorBoard />} />
          <Route path="/q/:code" element={<JoinQueue />} />
          <Route path="/t/:id" element={<TicketStatus />} />
          <Route path="/dev" element={<DevTools />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </I18nProvider>
  )
}
