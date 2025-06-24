import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { cn } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue' 
}: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={cn(
              'text-sm font-medium',
              change.type === 'increase' ? 'text-green-600' : 'text-red-600'
            )}>
              {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}