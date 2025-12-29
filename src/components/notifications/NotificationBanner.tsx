import { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { usePatients } from '@/contexts/PatientContext';
import { Patient } from '@/types/patient';
import { format, addDays, isEqual, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  patient: Patient;
  message: string;
}

export function NotificationBanner() {
  const { patients } = usePatients();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkAppointments = () => {
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);

      const upcomingAppointments = patients.filter(patient => {
        if (patient.status !== 'agendado') return false;
        const appointmentDate = startOfDay(parseISO(patient.appointmentDate));
        return isEqual(appointmentDate, tomorrow);
      });

      const newNotifications: Notification[] = upcomingAppointments.map(patient => ({
        id: patient.id,
        patient,
        message: `ATENÇÃO: Você tem paciente agendado amanhã – ${patient.name}`,
      }));

      setNotifications(newNotifications);
    };

    checkAppointments();
    const interval = setInterval(checkAppointments, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [patients]);

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  const dismissNotification = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="space-y-2 p-4">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={cn(
            'flex items-center justify-between gap-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 animate-fade-in',
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{notification.message}</p>
              <p className="text-sm text-muted-foreground">
                Data: {format(parseISO(notification.patient.appointmentDate), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
          <button
            onClick={() => dismissNotification(notification.id)}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
