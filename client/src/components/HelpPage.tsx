import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  Settings, 
  GraduationCap, 
  Clock, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  XCircle,
  School,
  Video,
  Mail,
  Phone
} from 'lucide-react';

export function HelpPage() {
  const faqs = [
    {
      question: "Bagaimana cara absen masuk dan pulang?",
      answer: "Siswa dapat menggunakan tombol 'Absen Masuk' dan 'Absen Pulang' di dashboard. Pastikan absen masuk dilakukan terlebih dahulu sebelum absen pulang.",
      role: "siswa"
    },
    {
      question: "Bagaimana cara input absensi siswa secara manual?",
      answer: "Guru dapat memilih kelas dan tanggal, kemudian menggunakan tombol status (Hadir, Izin, Sakit, Alpha) untuk setiap siswa di daftar absensi.",
      role: "guru"
    },
    {
      question: "Bagaimana cara mengelola data siswa dan guru?",
      answer: "Admin dapat menggunakan tab manajemen untuk menambah, mengedit, atau menghapus data siswa, guru, dan kelas melalui dashboard admin.",
      role: "admin"
    },
    {
      question: "Apa arti dari setiap status kehadiran?",
      answer: "Hadir = siswa datang ke sekolah, Izin = tidak hadir dengan keterangan, Sakit = tidak hadir karena sakit, Alpha = tidak hadir tanpa keterangan.",
      role: "umum"
    }
  ];

  const statusInfo = [
    { status: 'hadir', icon: <CheckCircle className="h-4 w-4" />, label: 'Hadir', description: 'Siswa hadir di sekolah', color: 'bg-green-100 text-green-800' },
    { status: 'izin', icon: <AlertCircle className="h-4 w-4" />, label: 'Izin', description: 'Tidak hadir dengan izin/keterangan', color: 'bg-yellow-100 text-yellow-800' },
    { status: 'sakit', icon: <AlertCircle className="h-4 w-4" />, label: 'Sakit', description: 'Tidak hadir karena sakit', color: 'bg-orange-100 text-orange-800' },
    { status: 'alpha', icon: <XCircle className="h-4 w-4" />, label: 'Alpha', description: 'Tidak hadir tanpa keterangan', color: 'bg-red-100 text-red-800' }
  ];

  const features = [
    {
      role: 'siswa',
      icon: <GraduationCap className="h-6 w-6" />,
      title: 'Portal Siswa',
      items: [
        'Absen masuk dan pulang mandiri',
        'Melihat status kehadiran hari ini',
        'Riwayat absensi lengkap',
        'Update profil pribadi'
      ]
    },
    {
      role: 'guru',
      icon: <Users className="h-6 w-6" />,
      title: 'Portal Guru',
      items: [
        'Input absensi siswa manual',
        'Kelola absensi per kelas',
        'Rekap absensi harian',
        'Export laporan (coming soon)'
      ]
    },
    {
      role: 'admin',
      icon: <Settings className="h-6 w-6" />,
      title: 'Portal Admin',
      items: [
        'Manajemen data siswa & guru',
        'Manajemen kelas',
        'Dashboard statistik lengkap',
        'Laporan komprehensif (coming soon)'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-br from-blue-600 to-green-500 p-4 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <School className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Bantuan Sekolah Absenku</h1>
        <p className="text-gray-600">Panduan lengkap penggunaan sistem manajemen absensi sekolah</p>
      </div>

      {/* Fitur berdasarkan Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Fitur Berdasarkan Peran Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.role} className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  {feature.icon}
                  {feature.title}
                </div>
                <ul className="space-y-2">
                  {feature.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Kehadiran */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            Penjelasan Status Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statusInfo.map((status) => (
              <div key={status.status} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Badge className={`${status.color} flex items-center gap-1`}>
                  {status.icon}
                  {status.label}
                </Badge>
                <span className="text-sm text-gray-700">{status.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Pertanyaan yang Sering Diajukan (FAQ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start gap-3 mb-2">
                  <Badge variant="outline" className="capitalize">
                    {faq.role}
                  </Badge>
                  <h4 className="font-medium text-gray-900">{faq.question}</h4>
                </div>
                <p className="text-gray-600 text-sm ml-14">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Video */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-600" />
            Video Tutorial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Video Tutorial Segera Tersedia</h3>
            <p className="text-gray-600 mb-4">
              Kami sedang mempersiapkan video tutorial lengkap untuk membantu Anda menggunakan sistem ini.
            </p>
            <Button variant="outline" disabled>
              <Video className="h-4 w-4 mr-2" />
              Tonton Tutorial
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kontak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Kontak Admin Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Bantuan Teknis</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                admin@sekolahabsenku.sch.id
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                (021) 123-4567
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Jam Layanan</h4>
              <div className="text-sm text-gray-600">
                <p>Senin - Jumat: 08:00 - 16:00 WIB</p>
                <p>Sabtu: 08:00 - 12:00 WIB</p>
                <p>Minggu: Libur</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500 border-t pt-6">
        <p>🕐 Zona Waktu Aplikasi: Asia/Jakarta</p>
        <p>📱 Sistem responsif - dapat diakses dari berbagai perangkat</p>
      </div>
    </div>
  );
}