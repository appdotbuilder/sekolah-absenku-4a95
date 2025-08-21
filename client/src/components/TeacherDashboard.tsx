import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar as CalendarIcon,
  User as UserIcon,
  BookOpen,
  BarChart3,
  Download,
  Plus,
  Edit,
  School
} from 'lucide-react';
import type { User, Teacher, Class, Student, Attendance } from '../../../server/src/schema';
import { DemoNotice } from './DemoNotice';

interface TeacherDashboardProps {
  user: User;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classAttendance, setClassAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load teacher data
  const loadTeacher = useCallback(async () => {
    try {
      const teacherData = await trpc.getTeacherByUserId.query(user.id);
      setTeacher(teacherData);
    } catch (err: any) {
      console.error('Failed to load teacher data:', err);
      setError('Gagal memuat data guru');
    }
  }, [user.id]);

  // Load teacher's classes
  const loadTeacherClasses = useCallback(async () => {
    if (!teacher) return;
    
    try {
      const teacherClasses = await trpc.getTeacherClasses.query(teacher.id);
      setClasses(teacherClasses);
      if (teacherClasses.length > 0 && !selectedClass) {
        setSelectedClass(teacherClasses[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load teacher classes:', err);
    }
  }, [teacher?.id, selectedClass]);

  // Load students by class
  const loadStudentsByClass = useCallback(async () => {
    if (!selectedClass) return;
    
    try {
      const classStudents = await trpc.getStudentsByClass.query(selectedClass);
      setStudents(classStudents);
    } catch (err: any) {
      console.error('Failed to load students:', err);
    }
  }, [selectedClass]);

  // Load class attendance for selected date
  const loadClassAttendance = useCallback(async () => {
    if (!selectedClass) return;
    
    try {
      const attendance = await trpc.getClassAttendance.query({
        classId: selectedClass,
        date: selectedDate.toISOString().split('T')[0]
      });
      setClassAttendance(attendance);
    } catch (err: any) {
      console.error('Failed to load class attendance:', err);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    loadTeacher();
  }, [loadTeacher]);

  useEffect(() => {
    if (teacher) {
      loadTeacherClasses();
    }
  }, [teacher, loadTeacherClasses]);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsByClass();
      loadClassAttendance();
    }
  }, [selectedClass, loadStudentsByClass, loadClassAttendance]);

  const handleCreateAttendance = async (studentId: number, status: 'hadir' | 'izin' | 'sakit' | 'alpha') => {
    if (!selectedClass || !teacher) return;

    setIsLoading(true);
    try {
      await trpc.createAttendance.mutate({
        student_id: studentId,
        class_id: selectedClass,
        teacher_id: teacher.id,
        date: selectedDate.toISOString().split('T')[0],
        status,
        check_in_time: status === 'hadir' ? new Date().toISOString() : null,
        check_out_time: null,
        notes: null
      });
      
      await loadClassAttendance();
    } catch (err: any) {
      console.error('Failed to create attendance:', err);
      setError(err.message || 'Gagal menyimpan absensi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCreateAttendance = async () => {
    if (!selectedClass || !teacher || students.length === 0) return;

    setIsLoading(true);
    try {
      const attendanceData = students.map((student: Student) => ({
        student_id: student.id,
        class_id: selectedClass,
        teacher_id: teacher.id,
        date: selectedDate.toISOString().split('T')[0],
        status: 'alpha' as const,
        check_in_time: null,
        check_out_time: null,
        notes: null
      }));

      await trpc.bulkCreateAttendance.mutate(attendanceData);
      await loadClassAttendance();
    } catch (err: any) {
      console.error('Failed to bulk create attendance:', err);
      setError(err.message || 'Gagal membuat absensi bulk');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      hadir: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Hadir', color: 'bg-green-500' },
      izin: { variant: 'secondary', icon: <AlertCircle className="h-3 w-3" />, label: 'Izin', color: 'bg-yellow-500' },
      sakit: { variant: 'secondary', icon: <AlertCircle className="h-3 w-3" />, label: 'Sakit', color: 'bg-orange-500' },
      alpha: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Alpha', color: 'bg-red-500' }
    } as const;

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.alpha;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const getStudentAttendance = (studentId: number) => {
    return classAttendance.find((att: Attendance) => att.student_id === studentId);
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

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data guru...</p>
        </div>
      </div>
    );
  }

  const selectedClassData = classes.find((cls: Class) => cls.id === selectedClass);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Selamat datang, {teacher.full_name}! 👨‍🏫</h1>
            <p className="text-green-100">
              NIP: {teacher.nip} • {classes.length} Kelas • {formatDate(new Date())}
            </p>
          </div>
        </div>
      </div>

      <DemoNotice message="Data guru, kelas, dan absensi menggunakan stub backend. Handler database perlu diimplementasikan." />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Absensi
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Laporan
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Siswa
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profil
          </TabsTrigger>
        </TabsList>

        {/* Attendance Management Tab */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Class Selection */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Kelola Absensi Kelas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Pilih Kelas</label>
                  <Select
                    value={selectedClass?.toString()}
                    onValueChange={(value) => setSelectedClass(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: Class) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name} ({cls.description || 'Tidak ada deskripsi'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tanggal</label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(new Date(e.target.value))}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {selectedClass && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Kelas: {selectedClassData?.name}</p>
                    <p className="text-sm text-gray-600">
                      {students.length} siswa • {formatDate(selectedDate)}
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleBulkCreateAttendance}
                    disabled={isLoading || classAttendance.length > 0}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Buat Absensi Hari Ini
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Attendance Table */}
          {selectedClass && students.length > 0 && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Daftar Absensi Siswa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>NIS</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student: Student, index: number) => {
                        const attendance = getStudentAttendance(student.id);
                        return (
                          <TableRow key={student.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{student.full_name}</TableCell>
                            <TableCell>{student.nis}</TableCell>
                            <TableCell>
                              {attendance ? (
                                getStatusBadge(attendance.status)
                              ) : (
                                <Badge variant="outline">Belum diabsen</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateAttendance(student.id, 'hadir')}
                                  disabled={isLoading || !!attendance}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                                >
                                  Hadir
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateAttendance(student.id, 'izin')}
                                  disabled={isLoading || !!attendance}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 text-xs"
                                >
                                  Izin
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateAttendance(student.id, 'sakit')}
                                  disabled={isLoading || !!attendance}
                                  className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 text-xs"
                                >
                                  Sakit
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateAttendance(student.id, 'alpha')}
                                  disabled={isLoading || !!attendance}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
                                >
                                  Alpha
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Laporan Absensi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fitur Laporan</h3>
                <p className="text-gray-600 mb-4">
                  Fitur laporan dan statistik akan segera tersedia
                </p>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Laporan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-green-600" />
                Daftar Siswa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classes.length > 0 ? (
                <div className="space-y-4">
                  {classes.map((cls: Class) => (
                    <div key={cls.id} className="border rounded-lg p-4">
                      <h4 className="font-medium text-lg mb-2">{cls.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {cls.description || 'Tidak ada deskripsi'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClass(cls.id)}
                      >
                        Lihat Siswa
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tidak ada kelas yang ditugaskan</p>
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
                Profil Guru
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <p className="text-lg text-gray-900">{teacher.full_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">NIP</label>
                  <p className="text-lg text-gray-900">{teacher.nip}</p>
                </div>
                
                {teacher.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-lg text-gray-900">{teacher.email}</p>
                  </div>
                )}
                
                {teacher.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Telepon</label>
                    <p className="text-lg text-gray-900">{teacher.phone}</p>
                  </div>
                )}
                
                {teacher.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Alamat</label>
                    <p className="text-lg text-gray-900">{teacher.address}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
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