import { cn, formatStatusLabel } from '@/lib/utils';
 import type { ApplicationStatus } from '@/lib/types';
 import { STATUS_CONFIG } from '@/lib/types';
 
 interface StatusBadgeProps {
   status: ApplicationStatus;
   className?: string;
 }
 
 export function StatusBadge({ status, className }: StatusBadgeProps) {
   const config = STATUS_CONFIG[status];
   
   return (
     <span className={cn('status-badge', config.className, className)}>
      {formatStatusLabel(status)}
     </span>
   );
 }