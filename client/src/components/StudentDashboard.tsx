import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { trpc } from '@/utils/trpc';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Activity,
  Calendar as CalendarIcon,
  User as UserIcon,
  BookOpen,
  TimerIcon,
  History
} from 'lucide-react';
import type { User, Student, Attendance } from '../../../server/src/schema';
import { DemoNotice } from './DemoNotice';

interface StudentDashboardProps {
  user: User;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Load student data
  const loadStudent = useCallback(async () => {
    try {
      const studentData = await trpc.getStudentByUserId.query(user.id);
      setStudent(studentData);
    } catch (err: any) {
      console.error('Failed to load student data:', err);
      setError('Gagal memuat data siswa');
    }
  }, [user.id]);

  // Load today's attendance
  const loadTodayAttendance = useCallback(async () => {
    if (!student) return;
    
    try {
      const attendance = await trpc.getStudentAttendanceToday.query(student.id);
      setTodayAttendance(attendance);
    } catch (err: any) {
      console.error('Failed to load today attendance:', err);
    }
  }, [student?.id]);

  // Load attendance history
  const loadAttendanceHistory = useCallback(async () => {
    if (!student) return;
    
    try {
      const history = await trpc.getStudentAttendanceHistory.query({
        studentId: student.id
      });
      setAttendanceHistory(history);
    } catch (err: any) {
      console.error('Failed to load attendance history:', err);
    }
  }, [student?.id]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  useEffect(() => {
    if (student) {
      loadTodayAttendance();
      loadAttendanceHistory();
    }
  }, [student, loadTodayAttendance, loadAttendanceHistory]);

  const handleCheckInOut = async (type: 'check_in' | 'check_out') => {
    if (!student) return;

    setIsLoading(true);
    setError('');

    try {
      await trpc.studentCheckInOut.mutate({
        studentId: student.id,
        attendanceData: { type }
      });
      
      // Reload today's attendance
      await loadTodayAttendance();
      await loadAttendanceHistory();
    } catch (err: any) {
      console.error('Check in/out failed:', err);
      setError(err.message || `Gagal ${type === 'check_in' ? 'absen masuk' : 'absen pulang'}`);
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

  const formatTime = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
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

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <BookOpen className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Selamat datang, {student.full_name}! 👋</h1>
            <p className="text-blue-100">
              NIS: {student.nis} • Kelas: Loading... • {formatDate(new Date())}
            </p>
          </div>
        </div>
      </div>

      <DemoNotice message="Data siswa dan absensi menggunakan stub backend. Implementasikan handler database untuk data real." />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Absensi
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Riwayat
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profil
          </TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Today's Status */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Status Kehadiran Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAttendance ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(todayAttendance.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Waktu Masuk</span>
                      </div>
                      <span className="text-lg font-semibold text-green-800">
                        {formatTime(todayAttendance.check_in_time)}
                      </span>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 mb-1">
                        <TimerIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Waktu Pulang</span>
                      </div>
                      <span className="text-lg font-semibold text-blue-800">
                        {formatTime(todayAttendance.check_out_time)}
                      </span>
                    </div>
                  </div>

                  {todayAttendance.notes && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-yellow-800">Catatan:</span>
                      <p className="text-yellow-700">{todayAttendance.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Belum ada data absensi hari ini</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check In/Out Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Absen Masuk</h3>
                    <p className="text-green-100 text-sm mb-4">
                      Catat waktu kedatangan Anda
                    </p>
                    <Button
                      onClick={() => handleCheckInOut('check_in')}
                      disabled={isLoading || (todayAttendance?.check_in_time !== null)}
                      className="bg-white text-green-600 hover:bg-green-50"
                    >
                      {todayAttendance?.check_in_time ? '✓ Sudah Absen' : 'Absen Masuk'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Clock className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Absen Pulang</h3>
                    <p className="text-blue-100 text-sm mb-4">
                      Catat waktu kepulangan Anda
                    </p>
                    <Button
                      onClick={() => handleCheckInOut('check_out')}
                      disabled={isLoading || !todayAttendance?.check_in_time || (todayAttendance?.check_out_time !== null)}
                      className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                      {todayAttendance?.check_out_time ? '✓ Sudah Absen' : 'Absen Pulang'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Riwayat Absensi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {attendanceHistory.slice(0, 10).map((attendance: Attendance) => (
                    <div key={attendance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(attendance.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          Masuk: {formatTime(attendance.check_in_time)} | 
                          Pulang: {formatTime(attendance.check_out_time)}
                        </p>
                      </div>
                      {getStatusBadge(attendance.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada riwayat absensi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-blue-600" />
                Profil Siswa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <p className="text-lg text-gray-900">{student.full_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">NIS</label>
                  <p className="text-lg text-gray-900">{student.nis}</p>
                </div>
                
                {student.nisn && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">NISN</label>
                    <p className="text-lg text-gray-900">{student.nisn}</p>
                  </div>
                )}
                
                {student.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-lg text-gray-900">{student.email}</p>
                  </div>
                )}
                
                {student.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Telepon</label>
                    <p className="text-lg text-gray-900">{student.phone}</p>
                  </div>
                )}
                
                {student.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Alamat</label>
                    <p className="text-lg text-gray-900">{student.address}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  Edit Profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}