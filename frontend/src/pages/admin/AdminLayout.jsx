import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Main content — offset by sidebar width on md+ */}
      <main className="md:ml-56 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
