import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-50';
      case 'Approved':
        return 'bg-black text-white border-black hover:bg-black';
      case 'Rejected':
        return 'bg-red-600 text-white border-red-600 hover:bg-red-600';
      case 'Cancelled':
        return 'bg-gray-500 text-white border-gray-500 hover:bg-gray-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
    }
  };

  return (
    <Badge 
      className={cn(
        'px-3 py-1 text-xs font-medium rounded-full',
        getStatusStyles()
      )}
    >
      {status}
    </Badge>
  );
}