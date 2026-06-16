/**
 * ============================================================
 * AURA Restaurant System — Root App Component
 * ============================================================
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { RestaurantProvider } from './context/RestaurantContext';
import Navbar from './components/layout/Navbar';
import LoginPage from './pages/LoginPage/LoginPage';
import RobotUI from './pages/RobotUI/RobotUI';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AnalyticsPage from './pages/AnalyticsPage/AnalyticsPage';
import KitchenDisplay from './pages/KitchenDisplay/KitchenDisplay';
import EntertainmentHub from "./pages/EntertainmentHub/EntertainmentHub";
import MusicPage  from './pages/EntertainmentHub/MusicPage';
import GamesPage  from './pages/EntertainmentHub/GamesPage';
import StaffPage from './pages/StaffPage/StaffPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import { MusicPlayerProvider } from './context/MusicPlayerContext';

// ── Protected route shell ─────────────────────────────────────────────────────
function AppShell() {
  const { session } = useAppContext();
  const isAdmin = session?.role === 'admin';
  const isKitchen = session?.role === 'kitchen';

  // Not authenticated → always show Login
  if (!session) return <LoginPage />;

  // // ── TABLE ROLE (Full screen, no navbar) ──
  if (session.role === 'table') {
    return (
      <MusicPlayerProvider>
        <div className="min-h-screen bg-[#0f0f0f]">
          <Routes>
            <Route path="/" element={<RobotUI />} />
            <Route path="/robot" element={<RobotUI />} />
            <Route path="/entertain" element={<EntertainmentHub />} />
            {/* Security: If table types anything else (like /admin), send back to robot */}
            <Route path="*" element={<Navigate to="/robot" replace />} />
            <Route path="/entertain/music" element={<MusicPage />} />
            <Route path="/entertain/games" element={<GamesPage />} />
          </Routes>
        </div>
      </MusicPlayerProvider>
    );
  }

  // ── ADMIN / KITCHEN ROLE (Standard layout with navbar) ──
  return (
    <div className="min-h-screen bg-dark-950 bg-grid">
      <Navbar />
      <main>
        <Routes>
          {/* Role-aware root redirect */}
          <Route path="/" element={<Navigate to={isAdmin ? '/admin' : '/kitchen'} replace />} />

          {isAdmin && (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/staff" element={<StaffPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/kitchen" element={<KitchenDisplay />} />
            </>
          )}

          {isKitchen && (
            <>
              <Route path="/kitchen" element={<KitchenDisplay />} />
              <Route path="/admin" element={<Navigate to="/kitchen" replace />} />
            </>
          )}

          {/* Catch-all keeps users within role-scoped pages */}
          <Route path="*" element={<Navigate to={isAdmin ? '/admin' : '/kitchen'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
function App() {
  // 🚀 By putting the Router here at the very top, React never gets confused 
  // when you log out of a Table and log into an Admin!
  return (
    <Router>
      <AppProvider>
        <RestaurantProvider>
          <AppShell />
        </RestaurantProvider>
      </AppProvider>
    </Router>
  );
}

export default App;