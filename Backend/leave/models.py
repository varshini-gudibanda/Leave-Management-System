from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import User

class LeaveRequest(models.Model):

	LEAVE_TYPE_CHOICES = [
		("Sick", "Sick"),
		("Casual", "Casual"),
		("Vacation", "Vacation"),
	]
	STATUS_PENDING = "Pending"
	STATUS_APPROVED = "Approved"
	STATUS_REJECTED = "Rejected"
	STATUS_CANCELLED = "Cancelled"

	STATUS_CHOICES = [
		(STATUS_PENDING, "Pending"),
		(STATUS_APPROVED, "Approved"),
		(STATUS_REJECTED, "Rejected"),
		(STATUS_CANCELLED, "Cancelled"),
	]

	employee_name = models.CharField(max_length=200)
	leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
	start_date = models.DateField()
	end_date = models.DateField()
	status = models.CharField(
		max_length=20,
		choices=STATUS_CHOICES,
		default="Pending",
	)
	employee = models.ForeignKey(
        'Employee',
        on_delete=models.CASCADE,
        related_name='leave_requests',
        null=True,  
        blank=True
    )
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']

	def clean(self):
		if self.start_date and self.end_date and self.start_date > self.end_date:
			raise ValidationError("Start date must be on or before end date.")

		if self.employee_name and self.start_date and self.end_date:
			overlap_exists = LeaveRequest.objects.filter(
				employee_name=self.employee_name,
				start_date__lte=self.end_date,
				end_date__gte=self.start_date,
			).exclude(pk=self.pk).exists()
			if overlap_exists:
				raise ValidationError("Overlapping leave request for this employee.")

	def save(self, *args, **kwargs):
		if self.pk:
			previous = LeaveRequest.objects.get(pk=self.pk)
			if previous.status != self.status:
				allowed = {"Approved", "Rejected", "Cancelled"}
				if previous.status != "Pending" or self.status not in allowed:
					raise ValidationError("Status can only move from Pending to Approved/Rejected/Cancelled.")

		self.full_clean()
		super().save(*args, **kwargs)

	def __str__(self):
		return f"{self.employee_name} ({self.leave_type})"

class Employee(models.Model):
   
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='employee'
    )
    employee_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    date_joined = models.DateField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.full_name} ({self.employee_id})"
    
    class Meta:
        ordering = ['employee_id']