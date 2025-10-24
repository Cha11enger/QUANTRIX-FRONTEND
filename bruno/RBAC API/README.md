# RBAC API Collection

This Bruno collection contains comprehensive tests for the Role-Based Access Control (RBAC) system.

## Prerequisites

1. **Authentication**: You must be logged in and have a valid `accessToken` in your environment variables
2. **Base URL**: Ensure `baseUrl` is set to your API endpoint (e.g., `http://localhost:5000`)

## Test Sequence

The tests are designed to run in sequence:

1. **Get All Roles** - Verify default roles exist
2. **Get Role by ID** - Test individual role retrieval
3. **Create Custom Role** - Create a new custom role (saves `customRoleId`)
4. **Update Custom Role** - Modify the created role
5. **Delete Custom Role** - Remove the custom role
6. **Assign Role Permissions** - Test permission assignment to roles
7. **Get Current User Roles** - Verify current user's roles and permissions
8. **Check User Permission** - Test permission checking for current user
9. **Get All Permissions** - List all available permissions

## Environment Variables

Make sure these variables are set in your Bruno environment:

```
baseUrl=http://localhost:5000
accessToken=your-jwt-token
customRoleId=auto-generated-during-tests
```

## Default Roles

The system includes four default roles that are automatically assigned to all users:

- **ACCOUNTADMIN**: Full system administration privileges
- **DATAENGINEER**: Data pipeline and infrastructure management
- **DATAANALYST**: Data analysis and reporting capabilities
- **VIEWER**: Read-only access to data and reports

## Current User Endpoints

The API now focuses on current user management:

- `GET /api/v1/roles/me/roles` - Get current user's roles and permissions
- `POST /api/v1/roles/me/check-permission` - Check if current user has specific permission
- `GET /api/v1/users/me/current-role` - Get current active role
- `PUT /api/v1/users/me/current-role` - Switch current active role

## Key Features Tested

- ✅ Default role assignment during user registration
- ✅ Custom role CRUD operations (admin only)
- ✅ Role permission management (admin only)
- ✅ Current user role and permission queries
- ✅ Permission checking for current user
- ✅ Role switching for current user
- ✅ Protection of default roles from modification/deletion
- ✅ Permission-based access control
- ✅ Audit logging for role changes

## Notes

- Default roles cannot be modified or deleted
- Custom roles can be created, updated, and deleted
- All role operations are logged for audit purposes
- Permission checks are enforced at the middleware level