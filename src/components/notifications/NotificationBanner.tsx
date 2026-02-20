import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, X, AlertTriangle, Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { usePatients } from '@/contexts/PatientContext';
import { Patient, PROCEDURE_LABELS } from '@/types/patient';
import { format, addDays, isEqual, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  patient: Patient;
  triggeredAt: string;
}

const NOTIFICATION_TIMES = ['08:00', '09:30', '13:00', '15:00', '16:00', '19:00'];

const playAlertSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = (startTime: number, frequency: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playBeep(now, 523.25, 0.15);
    playBeep(now + 0.2, 659.25, 0.15);
    playBeep(now + 0.4, 783.99, 0.25);
  } catch {
    // Audio not supported - silent fallback
  }
};

export function NotificationBanner() {
  const { patients } = usePatients();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const hasPlayedSound = useRef(false);
  const soundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safePatients = patients ?? [];

  const forceTestNotification = useCallback(() => {
    const now = new Date();
    const tomorrow = addDays(startOfDay(now), 1);
    
    const upcomingAppointments = safePatients.filter(patient => {
      if (!patient || patient.status !== 'agendado') return false;
      try {
        const appointmentDate = startOfDay(parseISO(patient.appointmentDate ?? ''));
        return isEqual(appointmentDate, tomorrow);
      } catch { return false; }
    });

    if (upcomingAppointments.length === 0) {
      alert('Nenhum paciente com consulta agendada para amanhã!');
      return;
    }

    const testNotifications: Notification[] = upcomingAppointments.map(patient => ({
      id: `${patient.id}-test-${Date.now()}`,
      patient,
      triggeredAt: format(now, 'HH:mm'),
    }));

    setNotifications(testNotifications);
    setCurrentNotification(testNotifications[0] ?? null);
    setShowModal(true);
    playAlertSound();
  }, [safePatients]);

  const checkNotifications = useCallback(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const currentTime = format(now, 'HH:mm');

    const isNotificationTime = NOTIFICATION_TIMES.some(time => {
      const [targetHour, targetMin] = time.split(':').map(Number);
      const [currentHour, currentMin] = currentTime.split(':').map(Number);
      return targetHour === currentHour && Math.abs(targetMin - currentMin) <= 1;
    });

    if (!isNotificationTime) return;

    const upcomingAppointments = safePatients.filter(patient => {
      if (!patient || patient.status !== 'agendado') return false;
      try {
        const appointmentDate = startOfDay(parseISO(patient.appointmentDate ?? ''));
        return isEqual(appointmentDate, tomorrow);
      } catch { return false; }
    });

    if (upcomingAppointments.length === 0) return;

    const newNotifications: Notification[] = upcomingAppointments.map(patient => ({
      id: `${patient.id}-${currentTime}`,
      patient,
      triggeredAt: currentTime,
    }));

    const unseenNotifications = newNotifications.filter(
      n => !dismissed.has(n.id)
    );

    if (unseenNotifications.length > 0) {
      setNotifications(unseenNotifications);
      setCurrentNotification(unseenNotifications[0] ?? null);
      setShowModal(true);
      
      if (!hasPlayedSound.current) {
        playAlertSound();
        hasPlayedSound.current = true;
        soundTimeoutRef.current = setTimeout(() => { hasPlayedSound.current = false; }, 120000);
      }
    }
  }, [safePatients, dismissed]);

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => {
      clearInterval(interval);
      if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
    };
  }, [checkNotifications]);

  const dismissNotification = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    
    const remaining = notifications.filter(n => n.id !== id && !dismissed.has(n.id));
    if (remaining.length > 0) {
      setCurrentNotification(remaining[0] ?? null);
    } else {
      setShowModal(false);
      setCurrentNotification(null);
    }
  };

  const dismissAll = () => {
    const allIds = notifications.map(n => n.id);
    setDismissed(prev => new Set([...prev, ...allIds]));
    setShowModal(false);
    setCurrentNotification(null);
  };

  const visibleBannerNotifications = notifications.filter(n => !dismissed.has(n.id));

  const safeFormatDate = (dateStr?: string) => {
    if (!dateStr) return 'Data não informada';
    try {
      return format(parseISO(dateStr), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch { return dateStr; }
  };

  return (
    <>
      {!showModal && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={forceTestNotification}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning text-warning-foreground font-medium shadow-lg hover:opacity-90 transition-opacity"
          >
            <Bell className="h-4 w-4" />
            Notificações
          </button>
        </div>
      )}

      {visibleBannerNotifications.length > 0 && !showModal && (
        <div className="p-4">
          <button
            onClick={() => {
              setCurrentNotification(visibleBannerNotifications[0] ?? null);
              setShowModal(true);
            }}
            className="w-full flex items-center justify-between gap-4 rounded-lg border-2 border-warning bg-warning/10 px-4 py-3 animate-pulse-soft hover:bg-warning/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <span className="font-semibold text-foreground">
                {visibleBannerNotifications.length} lembrete{visibleBannerNotifications.length > 1 ? 's' : ''} de consulta - Clique para ver
              </span>
            </div>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </button>
        </div>
      )}

      {showModal && currentNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={dismissAll}
          />
          
          <div className="relative w-full max-w-lg animate-scale-in">
            <div className="rounded-2xl border-4 border-warning bg-card shadow-2xl overflow-hidden">
              <div className="bg-warning px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-foreground/20 animate-pulse">
                    <Bell className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-warning-foreground">
                      LEMBRETE DE CONSULTA
                    </h2>
                    <p className="text-sm text-warning-foreground/80">
                      Consulta agendada para amanhã!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(currentNotification.id)}
                  className="p-2 rounded-full hover:bg-warning-foreground/20 transition-colors"
                >
                  <X className="h-5 w-5 text-warning-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paciente</p>
                    <p className="text-xl font-bold text-foreground">
                      {currentNotification.patient?.name ?? 'Nome não informado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data da Consulta</p>
                    <p className="text-xl font-bold text-foreground">
                      {safeFormatDate(currentNotification.patient?.appointmentDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário da Consulta</p>
                    <p className="text-xl font-bold text-foreground">
                      {currentNotification.patient?.appointmentTime || 'Não informado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Procedimento(s)</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(currentNotification.patient?.procedures ?? []).map(proc => (
                        <span
                          key={proc}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                        >
                          {PROCEDURE_LABELS[proc] ?? proc}
                        </span>
                      ))}
                      {(currentNotification.patient?.procedures ?? []).length === 0 && (
                        <span className="text-sm text-muted-foreground">Nenhum informado</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Telefone para contato</p>
                  <a
                    href={`https://wa.me/55${(currentNotification.patient?.phone ?? '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-primary hover:underline"
                  >
                    {currentNotification.patient?.phone ?? 'Não informado'}
                  </a>
                </div>

                {currentNotification.patient?.observations && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Observações</p>
                    <p className="text-foreground">{currentNotification.patient.observations}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-muted/30 border-t border-border flex gap-3">
                {notifications.filter(n => !dismissed.has(n.id)).length > 1 && (
                  <button
                    onClick={() => dismissNotification(currentNotification.id)}
                    className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                  >
                    Próximo ({notifications.filter(n => !dismissed.has(n.id)).length - 1} restante{notifications.filter(n => !dismissed.has(n.id)).length > 2 ? 's' : ''})
                  </button>
                )}
                <button
                  onClick={dismissAll}
                  className={cn(
                    "px-4 py-3 rounded-lg font-medium transition-colors",
                    notifications.filter(n => !dismissed.has(n.id)).length > 1
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "flex-1 bg-primary text-primary-foreground hover:opacity-90"
                  )}
                >
                  {notifications.filter(n => !dismissed.has(n.id)).length > 1 ? 'Dispensar Todos' : 'OK, Entendi'}
                </button>
              </div>
            </div>

            {notifications.filter(n => !dismissed.has(n.id)).length > 1 && (
              <div className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-sm font-bold shadow-lg">
                {notifications.filter(n => !dismissed.has(n.id)).length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
