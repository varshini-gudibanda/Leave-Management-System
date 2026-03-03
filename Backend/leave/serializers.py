from rest_framework import serializers
from django.contrib.auth.models import User
from .models import LeaveRequest, Employee
import re
from datetime import timedelta

class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'employee_name',
            'leave_type',
            'start_date',
            'end_date',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'employee_name', 'status', 'created_at', 'updated_at']

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                "Start date must be on or before end date."
            )
        
        if start_date and end_date:
            duration = (end_date - start_date).days + 1
            if duration > 5:
                raise serializers.ValidationError(
                    "More than 5 leaves cant be granted at once"
                )
        
        return data
    
class EmployeeDetailSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    class Meta:
        model = Employee
        fields = [
            'employee_id',
            'full_name',
            'department',
            'phone',
            'date_joined',
            'email',
        ]

class LeaveDetailSerializer(serializers.ModelSerializer):
    employee = EmployeeDetailSerializer(read_only=True)
    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'employee',
            'leave_type',
            'start_date',
            'end_date',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'employee',
            'created_at',
            'updated_at',
        ]

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['employee_id', 'full_name', 'department', 'phone', 'date_joined']

class UserSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'employee']

class RegisterSerializer(serializers.ModelSerializer):
    employee_id = serializers.CharField(max_length=50)
    full_name = serializers.CharField(max_length=200)
    department = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'password2',
            'employee_id',
            'full_name',
            'department',
            'phone',
        ]
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({
                'password2': 'Passwords do not match.'
            })
        
        if Employee.objects.filter(employee_id=data['employee_id']).exists():
            raise serializers.ValidationError({
                'employee_id': 'This employee ID already exists.'
            })

        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': 'This email is already registered.'
            })
        
        phone = data.get('phone', '')
        if phone and not re.match(r'^\d{10}$', phone):
            raise serializers.ValidationError({
                'phone': 'Phone number must be exactly 10 digits.'
            })
        
        return data
    
    def create(self, validated_data):
        employee_id = validated_data.pop('employee_id')
        full_name = validated_data.pop('full_name')
        department = validated_data.pop('department')
        phone = validated_data.pop('phone', '')
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['email'],  
            email=validated_data['email'],
            password=validated_data['password'],
            is_staff=False  
        )
        
        Employee.objects.create(
            user=user,
            employee_id=employee_id,
            full_name=full_name,
            department=department,
            phone=phone
        )
        return user