import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from './StatusBadge';
import { LeaveRequest } from '@/lib/types';

interface LeaveCardProps {
  leave: LeaveRequest;
}

export default function LeaveCard({ leave }: LeaveCardProps) {
  return (
    <Link href={`/leaves/${leave.id}`}>
      <Card className="hover:shadow-lg cursor-pointer transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{leave.employee_name}</CardTitle>
              <CardDescription>{leave.leave_type}</CardDescription>
            </div>
            <StatusBadge status={leave.status} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">
            {leave.start_date} to {leave.end_date}
          </p>
          <p className="text-xs text-gray-400">
            Submitted: {new Date(leave.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}