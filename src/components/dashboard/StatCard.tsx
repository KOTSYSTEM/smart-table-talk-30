import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function StatCard({ title, value, icon, trend, className, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    primary: 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20',
    success: 'bg-gradient-to-br from-success/20 to-success/5 border-success/20',
    warning: 'bg-gradient-to-br from-warning/20 to-warning/5 border-warning/20',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend.value)}% vs yesterday</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          variant === 'primary' && 'bg-primary/20 text-primary',
          variant === 'success' && 'bg-success/20 text-success',
          variant === 'warning' && 'bg-warning/20 text-warning',
          variant === 'default' && 'bg-secondary text-muted-foreground'
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
