# Global Error Handling and Consistent API Error Schema

## Overview

This implementation provides a standardized error handling mechanism across the entire backend application. It ensures that all errors follow a consistent schema with proper request ID tracking and comprehensive logging.

## Features

1. **Standardized Error Response Schema**:
   - `code`: HTTP status code or custom error code
   - `message`: Human-readable error message
   - `details`: Additional error-specific information
   - `requestId`: Unique identifier for the request
   - `timestamp`: ISO string of when the error occurred
   - `path`: The API endpoint that caused the error

2. **Request ID Tracking**:
   - Automatically generates unique request IDs if not provided
   - Propagates request ID through headers
   - Logs errors with request ID context

3. **Comprehensive Error Mapping**:
   - Maps generic JavaScript/TypeScript errors
   - Handles NestJS HTTP exceptions
   - Maps Prisma database errors with specific codes
   - Processes validation errors from class-validator

## Implementation Details

### Files Created

1. `src/common/filters/http-exception.filter.ts` - Global exception filter
2. `src/common/interceptors/request-id.interceptor.ts` - Request ID interceptor
3. `src/test-error/test-error.controller.ts` - Test error controller
4. `src/test-error/test-error.module.ts` - Test error module

### Files Modified

1. `src/main.ts` - Registered global filter and interceptor
2. `src/app.module.ts` - Added test error module

### Error Types Handled

#### Generic Errors
- Standard JavaScript/TypeScript errors
- Custom error classes
- Unexpected exceptions

#### HTTP Exceptions
- All NestJS HTTP exceptions (BadRequest, Unauthorized, NotFound, etc.)
- Custom HTTP exception responses

#### Prisma Database Errors
- `P2002`: Unique constraint violation → 409 Conflict
- `P2025`: Record not found → 404 Not Found
- `P2003`: Foreign key constraint → 400 Bad Request
- `P2000`: Value too long → 400 Bad Request

#### Validation Errors
- Class-validator validation errors
- Nested validation errors
- Constraint violations

## Usage Examples

### Sample Error Response
```json
{
  "code": 400,
  "message": "Bad Request Exception",
  "details": {
    "statusCode": 400,
    "message": "This is a bad request error",
    "error": "Bad Request"
  },
  "requestId": "1MZX7QKJ9V3",
  "timestamp": "2026-01-23T12:30:00.000Z",
  "path": "/api/v1/test-error/bad-request"
}
```

### Request ID Header
The system automatically includes a `X-Request-ID` header in all responses:
```
X-Request-ID: 1MZX7QKJ9V3
```

## Testing

Run the test script to verify the implementation:
```bash
# Start the backend server first
npm run start:dev

# In another terminal, run the test script
./test-errors.sh
```

Or use curl directly:
```bash
# Generic error
curl -i -X GET http://localhost:3000/api/v1/test-error/generic-error

# Bad request
curl -i -X GET http://localhost:3000/api/v1/test-error/bad-request

# Validation error
curl -i -X POST http://localhost:3000/api/v1/test-error/validation-error \
  -H "Content-Type: application/json" \
  -d '{"invalidField": "invalid"}'

# Prisma error simulation
curl -i -X GET http://localhost:3000/api/v1/test-error/prisma-error-simulation
```

## Benefits

1. **Improved Developer Experience**: Consistent error responses make debugging easier
2. **Better Observability**: Request ID tracking enables easy log correlation
3. **Enhanced Client Resilience**: Predictable error format allows for better error handling on clients
4. **Comprehensive Logging**: All errors are logged with context for debugging
5. **Proper HTTP Status Codes**: Accurate status codes based on error type