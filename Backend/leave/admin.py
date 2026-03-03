
from django.contrib import admin
from .models import LeaveRequest
from .models import LeaveRequest, Employee


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('employee_name', 'leave_type', 'start_date', 'end_date', 'status', 'created_at')
    list_filter = ('status', 'leave_type', 'created_at')
    search_fields = ('employee_name',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'full_name', 'department', 'phone', 'date_joined')
    search_fields = ('employee_id', 'full_name', 'department')
    list_filter = ('department', 'date_joined')