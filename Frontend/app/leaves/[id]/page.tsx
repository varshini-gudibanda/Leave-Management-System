'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { auth } from '@/lib/auth';
import { LeaveDetail, User } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import Sidebar from '@/components/Sidebar';

export default function LeaveDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const [leave, setLeave] = useState<LeaveDetail | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.push('/auth/login');
      return;
    }
    setIsReady(true);
  }, [router]);

  useEffect(() => {
    if (!isReady) return;
    const loadData = async () => {
      try {
        const [leaveData, userData] = await Promise.all([
          apiClient.getLeaveDetail(id),
          apiClient.getCurrentUser(),
        ]);
        setLeave(leaveData);
        setUser(userData);
      } catch (err) {
        setError('Failed to load leave details');
      } finally {
        setLoading(false);
      }
    };

    if (isReady) {
      loadData();
    }
  }, [id, isReady]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const updated = await apiClient.approveLeave(id);
      setLeave(updated);
    } catch (err) {
      setError('Failed to approve leave');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const updated = await apiClient.rejectLeave(id);
      setLeave(updated);
    } catch (err) {
      setError('Failed to reject leave');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiClient.cancelLeave(id);
      setLeave(updated);
    } catch (err: any) {
      console.error('Cancel error:', err);
      
      let errorMessage = 'Failed to cancel leave';
      
      if (err.response?.data) {
        const data = err.response.data;
        console.error('Error data:', data);
        
        // Try to extract error message from different possible formats
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMessage = data.non_field_errors[0];
        } else {
          // Try to get first error from any field
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const firstError = data[firstKey];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(String(errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  if (!isReady) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !leave) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-4xl">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error || 'Leave request not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canApprove = user?.is_staff && leave.status === 'Pending';
  const canReject = user?.is_staff && leave.status === 'Pending';
  // Employee can cancel their own pending leave requests
  const canCancel = !user?.is_staff && leave.status === 'Pending';
  const employeeName = leave.employee?.full_name || leave.employee_name || 'N/A';
  const employeeId = leave.employee?.employee_id || 'N/A';
  const employeeDepartment = leave.employee?.department || 'N/A';
  const employeeEmail = leave.employee?.email || 'N/A';

  if (!isReady) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Leave Request #LR-2026-{String(id).padStart(3, '0')}
              </h1>
              <p className="text-gray-600 mt-1">
                Submitted on {formatDate(leave.created_at)}
              </p>
            </div>
            <StatusBadge status={leave.status} />
          </div>

          {/* Content */}
          <div className="max-w-4xl">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Employee Information */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Employee Information</h2>
              <p className="text-sm text-gray-600 mb-6">Review the leave request details below</p>

              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Employee Name</p>
                  <p className="text-base font-semibold text-gray-900">{employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Employee ID</p>
                  <p className="text-base font-semibold text-gray-900">{employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Department</p>
                  <p className="text-base font-semibold text-gray-900">{employeeDepartment}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-base font-semibold text-gray-900">{employeeEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Leave Type</p>
                  <p className="text-base font-semibold text-gray-900">{leave.leave_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Start Date</p>
                  <p className="text-base font-semibold text-gray-900">{formatDate(leave.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">End Date</p>
                  <p className="text-base font-semibold text-gray-900">{formatDate(leave.end_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Duration</p>
                  <p className="text-base font-semibold text-gray-900">
                    {calculateDuration(leave.start_date, leave.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Status</p>
                  <StatusBadge status={leave.status} />
                </div>
              </div>

              {/* Admin Actions */}
              {(canApprove || canReject) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">
                    Actions are permanent and will notify the employee via email.
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {actionLoading ? 'Rejecting...' : 'Reject Request'}
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="bg-gray-900 hover:bg-gray-800"
                    >
                      {actionLoading ? 'Approving...' : 'Approve Request'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Employee Cancel Action */}
              {canCancel && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">
                    You can cancel this leave request while it's pending.
                  </p>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      {actionLoading ? 'Cancelling...' : 'Cancel Leave Request'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}