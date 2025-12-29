import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success';
}

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
  const variants = {
    default: 'bg-card',
    primary: 'gradient-primary text-primary-foreground',
    success: 'bg-success/10 border-success/30',
  };

  return (
    <Card className={cn('glass-card overflow-hidden animate-scale-in', variants[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn(
              'text-sm font-medium',
              variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}>
              {title}
            </p>
            <p className={cn(
              'text-2xl font-bold tracking-tight',
              variant === 'primary' ? 'text-primary-foreground' : 'text-foreground',
              variant === 'success' && 'text-success'
            )}>
              {value}
            </p>
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}% vs mês anterior
              </p>
            )}
          </div>
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            variant === 'primary' ? 'bg-primary-foreground/20' : 'bg-primary/10'
          )}>
            <Icon className={cn(
              'h-6 w-6',
              variant === 'primary' ? 'text-primary-foreground' : 'text-primary'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
