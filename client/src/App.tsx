import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { User } from '../../server/src/schema';
import { LoginPage } from '@/components/LoginPage';
import { StudentDashboard } from '@/components/StudentDashboard';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, School } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is logged in from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      loadUser(parseInt(storedUserId));
    }
  }, []);

  const loadUser = useCallback(async (userId: number) => {
    try {
      setIsLoading(true);
      const user = await trpc.getCurrentUser.query(userId);
      setCurrentUser(user);
      localStorage.setItem('userId', userId.toString());
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('userId');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (userId: number) => {
    await loadUser(userId);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('userId');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderDashboard = () => {
    switch (currentUser.role) {
      case 'siswa':
        return <StudentDashboard user={currentUser} />;
      case 'guru':
        return <TeacherDashboard user={currentUser} />;
      case 'admin':
        return <AdminDashboard user={currentUser} />;
      default:
        return <div>Role tidak dikenal</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-green-500 p-2 rounded-xl">
                <School className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Sekolah Absenku</h1>
                <p className="text-sm text-green-600 font-medium">
                  {currentUser.role === 'siswa' && '📚 Portal Siswa'}
                  {currentUser.role === 'guru' && '👨‍🏫 Portal Guru'}
                  {currentUser.role === 'admin' && '⚙️ Portal Admin'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-blue-900">
                  Selamat datang, {currentUser.username}
                </p>
                <p className="text-xs text-green-600 capitalize">
                  {currentUser.role}
                </p>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-blue-700 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {renderDashboard()}
      </main>

      {/* Footer */}
      <footer className="bg-white/70 backdrop-blur-sm border-t border-blue-100 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Sekolah Absenku</span>
            </div>
            <p className="text-sm text-gray-600">
              Sistem Manajemen Absensi Sekolah - Zona Waktu: Asia/Jakarta
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;