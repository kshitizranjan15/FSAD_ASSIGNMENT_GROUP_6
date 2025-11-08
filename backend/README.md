# Backend Documentation

## Overview
The backend of the School Lending Equipment Management System is built with FastAPI and provides RESTful APIs for equipment management, user authentication, and lending operations.

## API Structure

### Authentication APIs (`auth_utils.py`, `users_api.py`)
- **Login**: `/users/login`
  - Method: POST
  - Handles user authentication and JWT token generation
- **Register**: `/users/register`
  - Method: POST
  - Creates new user accounts with role-based access

### Equipment APIs (`equipment_api.py`)
- **CRUD Operations**
  - GET `/equipment` - List all equipment
  - POST `/equipment` - Add new equipment
  - PUT `/equipment/{id}` - Update equipment
  - DELETE `/equipment/{id}` - Delete equipment
  - GET `/equipment/{id}` - Get specific equipment details

### Equipment Category APIs (`equipment_category_api.py`)
- **Category Management**
  - GET `/categories` - List all categories
  - POST `/categories` - Create new category
  - PUT `/categories/{id}` - Update category
  - DELETE `/categories/{id}` - Delete category

### Lending APIs (`lending_api.py`)
- **Lending Operations**
  - POST `/lending/request` - Create borrowing request
  - PUT `/lending/{id}/approve` - Approve request
  - PUT `/lending/{id}/reject` - Reject request
  - PUT `/lending/{id}/return` - Mark equipment as returned

### Analytics APIs (`analytics_api.py`)
- **Reporting Endpoints**
  - GET `/analytics/usage` - Equipment usage statistics
  - GET `/analytics/history` - Borrowing history
  - GET `/analytics/availability` - Equipment availability

## Environment Configuration

### Required Environment Variables (.env)
```env
DB_HOST=db4free.net
DB_PORT=3306
DB_USER=your_db4free_username
DB_PASSWORD=your_db4free_password
DB_NAME=your_database_name
SECRET_KEY=your_secret_key_here
```

## Authentication System

### JWT Token Implementation
- Uses `jose` library for JWT operations
- Token expiration: 24 hours
- Includes user ID and role in payload

### Password Security
- Implements password hashing using Passlib
- Supports both bcrypt and argon2 schemes
- Automatic password validation and strength checking

## Database Models

### User Model
- ID (Primary Key)
- Username
- Password Hash
- Role (Admin/Staff/Student)
- Email
- Created At

### Equipment Model
- ID (Primary Key)
- Name
- Description
- Category ID (Foreign Key)
- Status
- Condition
- Added Date

### Equipment Category Model
- ID (Primary Key)
- Name
- Description
- Created At

### Lending Model
- ID (Primary Key)
- Equipment ID (Foreign Key)
- User ID (Foreign Key)
- Borrow Date
- Due Date
- Return Date
- Status

## Development Setup

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Development Server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## Testing

### Running Tests
```bash
pytest tests/
```

### Available Test Suites
- `test_auth.py` - Authentication tests
- `test_equipment.py` - Equipment API tests
- `test_lending.py` - Lending operation tests

## Error Handling

The application implements comprehensive error handling:
- HTTP 400: Bad Request
- HTTP 401: Unauthorized
- HTTP 403: Forbidden
- HTTP 404: Not Found
- HTTP 500: Internal Server Error

## Logging

Logging configuration is in `main.py`:
- Info level for general operations
- Error level for exceptions
- Debug level for development

## Performance Considerations

- Implements database connection pooling
- Uses async/await for database operations
- Caches frequently accessed data
- Implements rate limiting for API endpoints

## Security Measures

1. **API Security**
   - JWT Authentication
   - Role-based access control
   - Request rate limiting

2. **Database Security**
   - Prepared statements
   - Input validation
   - Password hashing

3. **General Security**
   - CORS configuration
   - HTTP Security Headers
   - SSL/TLS support