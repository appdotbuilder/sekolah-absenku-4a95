import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { 
  Settings, 
  Users, 
  School, 
  BookOpen, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  UserPlus,
  GraduationCap
} from 'lucide-react';
import type { 
  User, 
  Student, 
  Teacher, 
  Class, 
  DashboardStats,
  CreateUserInput,
  CreateStudentInput,
  CreateTeacherInput,
  CreateClassInput
} from '../../../server/src/schema';
import { DemoNotice } from './DemoNotice';

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState<'user' | 'student' | 'teacher' | 'class' | null>(null);

  // Form states for creating new entities
  const [newUser, setNewUser] = useState<CreateUserInput>({
    username: '',
    password: '',
    role: 'siswa'
  });

  const [newStudent, setNewStudent] = useState<CreateStudentInput>({
    user_id: 0,
    class_id: 0,
    nis: '',
    nisn: null,
    full_name: '',
    email: null,
    phone: null,
    address: null,
    photo_url: null
  });

  const [newTeacher, setNewTeacher] = useState<CreateTeacherInput>({
    user_id: 0,
    nip: '',
    full_name: '',
    email: null,
    phone: null,
    address: null,
    photo_url: null
  });

  const [newClass, setNewClass] = useState<CreateClassInput>({
    name: '',
    description: null
  });

  // Load dashboard statistics
  const loadDashboardStats = useCallback(async () => {
    try {
      const stats = await trpc.getDashboardStats.query();
      setDashboardStats(stats);
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err);
    }
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsData, teachersData, classesData] = await Promise.all([
        trpc.getStudents.query(),
        trpc.getTeachers.query(),
        trpc.getClasses.query()
      ]);
      
      setStudents(studentsData);
      setTeachers(teachersData);
      setClasses(classesData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
    loadAllData();
  }, [loadDashboardStats, loadAllData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createUser.mutate(newUser);
      setNewUser({ username: '', password: '', role: 'siswa' });
      setShowCreateDialog(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createClass.mutate(newClass);
      setNewClass({ name: '', description: null });
      setShowCreateDialog(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat kelas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;
    
    setIsLoading(true);
    try {
      await trpc.deleteClass.mutate(classId);
      await loadAllData();
      await loadDashboardStats();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus kelas');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      hadir: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Hadir' },
      izin: { variant: 'secondary', icon: <AlertCircle className="h-3 w-3" />, label: 'Izin' },
      sakit: { variant: 'secondary', icon: <AlertCircle className="h-3 w-3" />, label: 'Sakit' },
      alpha: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Alpha' }
    } as const;

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.alpha;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Settings className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard Admin - Selamat datang! ⚙️</h1>
            <p className="text-purple-100">
              Admin: {user.username} • {formatDate(new Date())}
            </p>
          </div>
        </div>
      </div>

      <DemoNotice message="Dashboard admin menggunakan data stub. Semua statistik dan manajemen data perlu implementasi database real." />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Statistics */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Siswa</p>
                  <p className="text-3xl font-bold">{dashboardStats.total_students}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Guru</p>
                  <p className="text-3xl font-bold">{dashboardStats.total_teachers}</p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Kelas</p>
                  <p className="text-3xl font-bold">{dashboardStats.total_classes}</p>
                </div>
                <School className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Kehadiran Hari Ini</p>
                  <p className="text-3xl font-bold">
                    {dashboardStats.today_attendance.attendance_rate.toFixed(0)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="students">Siswa</TabsTrigger>
          <TabsTrigger value="teachers">Guru</TabsTrigger>
          <TabsTrigger value="classes">Kelas</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {dashboardStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Attendance Stats */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Statistik Kehadiran Hari Ini
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Hadir
                      </span>
                      <span className="font-semibold">{dashboardStats.today_attendance.present}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        Izin
                      </span>
                      <span className="font-semibold">{dashboardStats.today_attendance.permission}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        Sakit
                      </span>
                      <span className="font-semibold">{dashboardStats.today_attendance.sick}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Alpha
                      </span>
                      <span className="font-semibold">{dashboardStats.today_attendance.absent}</span>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between font-bold text-lg">
                        <span>Tingkat Kehadiran</span>
                        <span className="text-blue-600">
                          {dashboardStats.today_attendance.attendance_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    Aksi Cepat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Dialog open={showCreateDialog === 'user'} onOpenChange={(open) => !open && setShowCreateDialog(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="h-20 flex flex-col gap-2"
                          onClick={() => setShowCreateDialog('user')}
                        >
                          <UserPlus className="h-6 w-6" />
                          <span className="text-sm">Tambah User</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tambah User Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                          <Input
                            placeholder="Username"
                            value={newUser.username}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setNewUser(prev => ({ ...prev, username: e.target.value }))
                            }
                            required
                          />
                          <Input
                            type="password"
                            placeholder="Password"
                            value={newUser.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setNewUser(prev => ({ ...prev, password: e.target.value }))
                            }
                            required
                          />
                          <Select
                            value={newUser.role}
                            onValueChange={(value: 'siswa' | 'guru' | 'admin') =>
                              setNewUser(prev => ({ ...prev, role: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="siswa">Siswa</SelectItem>
                              <SelectItem value="guru">Guru</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Membuat...' : 'Buat User'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showCreateDialog === 'class'} onOpenChange={(open) => !open && setShowCreateDialog(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="h-20 flex flex-col gap-2"
                          onClick={() => setShowCreateDialog('class')}
                        >
                          <School className="h-6 w-6" />
                          <span className="text-sm">Tambah Kelas</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tambah Kelas Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                          <Input
                            placeholder="Nama Kelas"
                            value={newClass.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setNewClass(prev => ({ ...prev, name: e.target.value }))
                            }
                            required
                          />
                          <Input
                            placeholder="Deskripsi (opsional)"
                            value={newClass.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setNewClass(prev => ({ ...prev, description: e.target.value || null }))
                            }
                          />
                          <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Membuat...' : 'Buat Kelas'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="h-20 flex flex-col gap-2">
                      <Download className="h-6 w-6" />
                      <span className="text-sm">Export Data</span>
                    </Button>

                    <Button variant="outline" className="h-20 flex flex-col gap-2">
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-sm">Lihat Laporan</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Manajemen Siswa ({students.length})
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Siswa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead>NISN</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.slice(0, 10).map((student: Student, index: number) => (
                      <TableRow key={student.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell>{student.nis}</TableCell>
                        <TableCell>{student.nisn || '-'}</TableCell>
                        <TableCell>{student.email || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {students.length === 0 && (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada data siswa</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Manajemen Guru ({teachers.length})
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Guru
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((teacher: Teacher, index: number) => (
                      <TableRow key={teacher.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{teacher.full_name}</TableCell>
                        <TableCell>{teacher.nip}</TableCell>
                        <TableCell>{teacher.email || '-'}</TableCell>
                        <TableCell>{teacher.phone || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {teachers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada data guru</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5 text-purple-600" />
                  Manajemen Kelas ({classes.length})
                </CardTitle>
                <Button size="sm" onClick={() => setShowCreateDialog('class')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Kelas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls: Class) => (
                  <Card key={cls.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg">{cls.name}</h4>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteClass(cls.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {cls.description || 'Tidak ada deskripsi'}
                      </p>
                      <div className="text-xs text-gray-500">
                        Dibuat: {new Date(cls.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {classes.length === 0 && (
                <div className="text-center py-8">
                  <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada kelas yang dibuat</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Laporan & Statistik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fitur Laporan Lengkap</h3>
                <p className="text-gray-600 mb-4">
                  Laporan detail, grafik, dan export ke PDF/Excel akan segera tersedia
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}