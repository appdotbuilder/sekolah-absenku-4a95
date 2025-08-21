import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { School, Users, BookOpen, GraduationCap, User as UserIcon, Lock, AlertCircle } from 'lucide-react';
import type { LoginInput } from '../../../server/src/schema';

interface LoginPageProps {
  onLogin: (userId: number) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState<LoginInput>({
    username: '',
    password: '',
    role: 'siswa'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await trpc.login.mutate(formData);
      if (response && response.id) {
        onLogin(response.id);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login gagal. Periksa kembali username, password, dan role Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleInfo = () => {
    switch (formData.role) {
      case 'siswa':
        return {
          icon: <GraduationCap className="h-5 w-5 text-blue-600" />,
          title: 'Portal Siswa',
          description: 'Login dengan NIS/NISN dan password',
          placeholder: 'Masukkan NIS/NISN'
        };
      case 'guru':
        return {
          icon: <Users className="h-5 w-5 text-green-600" />,
          title: 'Portal Guru',
          description: 'Login dengan NIP dan password',
          placeholder: 'Masukkan NIP'
        };
      case 'admin':
        return {
          icon: <UserIcon className="h-5 w-5 text-purple-600" />,
          title: 'Portal Admin',
          description: 'Login dengan akun admin',
          placeholder: 'Masukkan username admin'
        };
      default:
        return {
          icon: <UserIcon className="h-5 w-5 text-gray-600" />,
          title: 'Portal Login',
          description: 'Silakan pilih role terlebih dahulu',
          placeholder: 'Username'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-4">
      {/* Background Illustration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 animate-float">
          <BookOpen className="h-8 w-8 text-blue-300/30" />
        </div>
        <div className="absolute top-20 right-20 animate-bounce-slow">
          <GraduationCap className="h-10 w-10 text-green-300/30" />
        </div>
        <div className="absolute bottom-20 left-20 animate-pulse">
          <Users className="h-6 w-6 text-blue-300/30" />
        </div>
        <div className="absolute bottom-10 right-10 animate-float-delayed">
          <School className="h-12 w-12 text-green-300/30" />
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-green-500 p-4 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-xl">
            <School className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Sekolah Absenku</h1>
          <p className="text-green-600 font-medium">Sistem Manajemen Absensi Sekolah</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {roleInfo.icon}
              <h2 className="text-xl font-semibold text-gray-800">{roleInfo.title}</h2>
            </div>
            <p className="text-sm text-gray-600">{roleInfo.description}</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Pilih Role
                </label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'siswa' | 'guru' | 'admin') =>
                    setFormData((prev: LoginInput) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="h-12 bg-white/70 border-blue-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="siswa">👨‍🎓 Siswa</SelectItem>
                    <SelectItem value="guru">👨‍🏫 Guru</SelectItem>
                    <SelectItem value="admin">⚙️ Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  {formData.role === 'siswa' ? 'NIS/NISN' : formData.role === 'guru' ? 'NIP' : 'Username'}
                </label>
                <Input
                  type="text"
                  placeholder={roleInfo.placeholder}
                  value={formData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: LoginInput) => ({ ...prev, username: e.target.value }))
                  }
                  className="h-12 bg-white/70 border-blue-200 focus:border-blue-400"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  className="h-12 bg-white/70 border-blue-200 focus:border-blue-400"
                  required
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white font-medium text-base shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Masuk...
                  </div>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            🕐 Zona Waktu: Asia/Jakarta
          </p>
          <p className="text-xs text-gray-500">
            Butuh bantuan? Hubungi admin sekolah
          </p>
        </div>
      </div>
    </div>
  );
}

// CSS Animation classes (add these to your global CSS)
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(5deg); }
  }
  
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-float-delayed {
    animation: float-delayed 4s ease-in-out infinite;
    animation-delay: 1s;
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 2s ease-in-out infinite;
    animation-delay: 0.5s;
  }
`;

// You can add this to your App.css or create a separate CSS file
export default LoginPage;