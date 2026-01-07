import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, X, AlertTriangle, Calendar, User, Stethoscope } from 'lucide-react';
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

// Horários de notificação (HH:MM)
const NOTIFICATION_TIMES = ['08:00', '09:30', '13:00', '15:00', '16:00', '19:00'];

// Função para tocar som de alerta usando Web Audio API
const playAlertSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Sequência de beeps para chamar atenção
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
    
    // 3 beeps crescentes
    playBeep(now, 523.25, 0.15);        // Dó
    playBeep(now + 0.2, 659.25, 0.15);  // Mi
    playBeep(now + 0.4, 783.99, 0.25);  // Sol
    
  } catch (error) {
    console.log('Áudio não suportado:', error);
  }
};

export function NotificationBanner() {
  const { patients } = usePatients();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const hasPlayedSound = useRef(false);

  const checkNotifications = useCallback(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const currentTime = format(now, 'HH:mm');

    // Verifica se é um dos horários de notificação (com margem de 1 minuto)
    const isNotificationTime = NOTIFICATION_TIMES.some(time => {
      const [targetHour, targetMin] = time.split(':').map(Number);
      const [currentHour, currentMin] = currentTime.split(':').map(Number);
      return targetHour === currentHour && Math.abs(targetMin - currentMin) <= 1;
    });

    if (!isNotificationTime) return;

    // Busca pacientes com consulta agendada para amanhã
    const upcomingAppointments = patients.filter(patient => {
      if (patient.status !== 'agendado') return false;
      const appointmentDate = startOfDay(parseISO(patient.appointmentDate));
      return isEqual(appointmentDate, tomorrow);
    });

    if (upcomingAppointments.length === 0) return;

    // Cria notificações para cada paciente
    const newNotifications: Notification[] = upcomingAppointments.map(patient => ({
      id: `${patient.id}-${currentTime}`,
      patient,
      triggeredAt: currentTime,
    }));

    // Filtra notificações já mostradas
    const unseenNotifications = newNotifications.filter(
      n => !dismissed.has(n.id)
    );

    if (unseenNotifications.length > 0) {
      setNotifications(unseenNotifications);
      setCurrentNotification(unseenNotifications[0]);
      setShowModal(true);
      
      // Toca som de alerta
      if (!hasPlayedSound.current) {
        playAlertSound();
        hasPlayedSound.current = true;
        // Reset após 2 minutos para permitir som no próximo horário
        setTimeout(() => { hasPlayedSound.current = false; }, 120000);
      }
    }
  }, [patients, dismissed]);

  useEffect(() => {
    // Verifica imediatamente ao carregar
    checkNotifications();

    // Verifica a cada 30 segundos
    const interval = setInterval(checkNotifications, 30000);

    return () => clearInterval(interval);
  }, [checkNotifications]);

  const dismissNotification = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    
    const remaining = notifications.filter(n => n.id !== id && !dismissed.has(n.id));
    if (remaining.length > 0) {
      setCurrentNotification(remaining[0]);
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

  // Notificações no topo (banner menor)
  const visibleBannerNotifications = notifications.filter(n => !dismissed.has(n.id));

  return (
    <>
      {/* Banner no topo */}
      {visibleBannerNotifications.length > 0 && !showModal && (
        <div className="p-4">
          <button
            onClick={() => {
              setCurrentNotification(visibleBannerNotifications[0]);
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

      {/* Modal Central */}
      {showModal && currentNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={dismissAll}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg animate-scale-in">
            <div className="rounded-2xl border-4 border-warning bg-card shadow-2xl overflow-hidden">
              {/* Header */}
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

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Paciente */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paciente</p>
                    <p className="text-xl font-bold text-foreground">
                      {currentNotification.patient.name}
                    </p>
                  </div>
                </div>

                {/* Data */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data da Consulta</p>
                    <p className="text-xl font-bold text-foreground">
                      {format(parseISO(currentNotification.patient.appointmentDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Procedimentos */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Procedimento(s)</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentNotification.patient.procedures.map(proc => (
                        <span
                          key={proc}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                        >
                          {PROCEDURE_LABELS[proc]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Telefone */}
                <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Telefone para contato</p>
                  <a
                    href={`https://wa.me/55${currentNotification.patient.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-primary hover:underline"
                  >
                    {currentNotification.patient.phone}
                  </a>
                </div>

                {/* Observações */}
                {currentNotification.patient.observations && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Observações</p>
                    <p className="text-foreground">{currentNotification.patient.observations}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/30 border-t border-border flex gap-3">
                {notifications.filter(n => !dismissed.has(n.id)).length > 1 && (
                  <button
                    onClick={() => {
                      dismissNotification(currentNotification.id);
                    }}
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

            {/* Contador */}
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
