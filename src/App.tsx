import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import AppLayout from './layouts/AppLayout'
import AiAssistantPage from './pages/AiAssistantPage'
import BookingPage from './pages/BookingPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import LostFoundPage from './pages/LostFoundPage'
import MarketPage from './pages/MarketPage'
import NewsPage from './pages/NewsPage'
import PublishNewsPage from './pages/PublishNewsPage'
import PublishLostFoundPage from './pages/PublishLostFoundPage'
import ProfilePage from './pages/ProfilePage'
import SellProductPage from './pages/SellProductPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="lost-found" element={<LostFoundPage />} />
        <Route path="market" element={<MarketPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="booking" element={<BookingPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="market/sell" element={<SellProductPage />} />
          <Route path="news/publish" element={<PublishNewsPage />} />
          <Route path="lost-found/publish" element={<PublishLostFoundPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
