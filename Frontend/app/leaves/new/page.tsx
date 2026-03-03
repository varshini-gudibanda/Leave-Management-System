'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { Textarea } from '@/components/ui/textarea';

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.push('/auth/login');
    } else {
      setIsReady(true);
    }
  }, [router]);

  if (!isReady) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeaveTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, leave_type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.leave_type || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (startDate > endDate) {
      setError('Start date must be before or equal to end date');
      setLoading(false);
      return;
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 5) {
      setError('More than 5 leaves cant be granted at once');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.createLeave(
        formData.leave_type,
        formData.start_date,
        formData.end_date
      );

      router.push(`/leaves/${response.id}`);
    } catch (err: any) {
      const errorData = err.response?.data || {};
      const errorMessage = errorData.error || errorData.detail || 'Failed to create leave request';
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">New Leave Request</h1>
            <p className="text-gray-600 mt-1">Fill in the details to submit a leave request</p>
          </div>

          {/* Form */}
          <div className="max-w-2xl bg-white rounded-lg shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Header */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
                <p className="text-sm text-gray-600 mt-1">All fields are required</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Leave Type */}
                <div>
                  <Label htmlFor="leave_type" className="text-sm font-medium text-gray-900">
                    Leave Type
                  </Label>
                  <Select value={formData.leave_type} onValueChange={handleLeaveTypeChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select leave type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vacation">Vacation</SelectItem>
                      <SelectItem value="Sick">Sick</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date" className="text-sm font-medium text-gray-900">
                      Start Date
                    </Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date" className="text-sm font-medium text-gray-900">
                      End Date
                    </Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-900">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any additional information..."
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}