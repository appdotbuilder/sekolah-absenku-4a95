import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface DemoNoticeProps {
  message?: string;
}

export function DemoNotice({ message = "Fitur ini menggunakan data demo. Implementasikan handler backend untuk data real." }: DemoNoticeProps) {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        📝 <strong>Demo Mode:</strong> {message}
      </AlertDescription>
    </Alert>
  );
}