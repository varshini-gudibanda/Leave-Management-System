from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import LeaveRequest, Employee
from .serializers import ( LeaveRequestSerializer, LeaveDetailSerializer, EmployeeDetailSerializer,RegisterSerializer, UserSerializer,)

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 1000

class RegisterView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        identifier = (
            request.data.get('identifier')
            or request.data.get('email')
            or request.data.get('username')
        )
        password = request.data.get('password')
        if not identifier or not password:
            return Response(
                {'error': 'Username/email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        username = identifier
        if '@' in identifier:
            try:
                username = User.objects.get(email__iexact=identifier).username
            except User.DoesNotExist:
                username = identifier

        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination
    
    def get_serializer_class(self):
        if getattr(self, 'action', None) == 'retrieve':
            return LeaveDetailSerializer
        return LeaveRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = LeaveRequest.objects.all().select_related('employee')
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if not user.is_staff:
            queryset = queryset.filter(employee__user=user)
        
        return queryset
    
    def perform_create(self, serializer):
        # Get employee profile if it exists
        try:
            employee = self.request.user.employee
            employee_name = employee.full_name
        except Employee.DoesNotExist:
            # For users without employee profile (like admin), use username
            employee = None
            employee_name = self.request.user.username
        
        serializer.save(employee=employee, employee_name=employee_name)
    
    def get_permissions(self):
        if self.action in ['approve', 'reject', 'destroy']:
            permission_classes = [IsAuthenticated, IsAdminUser]
        elif self.action == 'cancel':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        if not user.is_staff and instance.employee.user != user:
            return Response(
                {'error': 'You can only view your own leaves.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Cancel endpoint called! User: {request.user}, PK: {pk}")
        
        try:
            leave_request = self.get_object()
            logger.warning(f"Leave found: {leave_request.id}, Status: {leave_request.status}")
        except Exception as e:
            logger.warning(f"Leave not found: {str(e)}")
            return Response(
                {'error': f'Leave request not found: {str(e)}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = request.user
        logger.warning(f"User: {user.id}, Leave employee: {leave_request.employee.user.id if leave_request.employee else 'None'}")
    
        # Check if leave has an associated employee
        if not leave_request.employee:
            logger.warning("Leave has no employee")
            return Response(
                {'error': 'This leave request has no associated employee.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
        if leave_request.employee.user != user:
            logger.warning(f"Permission denied: {leave_request.employee.user.id} != {user.id}")
            return Response(
                {'error': f'You can only cancel your own leaves. (Employee user: {leave_request.employee.user.id}, Your ID: {user.id})'},
                status=status.HTTP_403_FORBIDDEN
            )

        if leave_request.status != LeaveRequest.STATUS_PENDING:
            logger.warning(f"Cannot cancel non-pending: {leave_request.status}")
            return Response(
                {'error': f'Cannot cancel a {leave_request.status} leave request.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.warning("Setting status to CANCELLED")
        leave_request.status = LeaveRequest.STATUS_CANCELLED
        leave_request.save()
        
        serializer = LeaveDetailSerializer(leave_request)
        logger.warning("Success!")
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        leave_request = self.get_object()
        
        if leave_request.status != LeaveRequest.STATUS_PENDING:
            return Response(
                {'error': 'Only Pending requests can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave_request.status = LeaveRequest.STATUS_APPROVED
        leave_request.save()
        
        serializer = LeaveDetailSerializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        leave_request = self.get_object()
        
        if leave_request.status != LeaveRequest.STATUS_PENDING:
            return Response(
                {'error': 'Only Pending requests can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave_request.status = LeaveRequest.STATUS_REJECTED
        leave_request.save()
        
        serializer = LeaveDetailSerializer(leave_request)
        return Response(serializer.data, status=status.HTTP_200_OK)