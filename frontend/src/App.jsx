import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AdminLayout from './pages/admin/AdminLayout';
import EventTypesPage from './pages/admin/EventTypes';
import AvailabilityPage from './pages/admin/Availability';
import MeetingsPage from './pages/admin/Meetings';

import BookingPage from './pages/public/BookingPage';
import ConfirmationPage from './pages/public/ConfirmationPage';
import CancelPage from './pages/public/CancelPage';
import ReschedulePage from './pages/public/ReschedulePage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="event-types" replace />} />
          <Route path="event-types" element={<EventTypesPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
        </Route>

        {/* Public routes */}
        <Route path="/book/:slug" element={<BookingPage />} />
        <Route path="/confirmation/:id" element={<ConfirmationPage />} />
        <Route path="/cancel/:id" element={<CancelPage />} />
        <Route path="/reschedule/:id" element={<ReschedulePage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/admin/event-types" replace />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl mb-4">404</p>
              <h2 className="text-xl font-bold text-gray-900">Page not found</h2>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
