import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest'; // Changed from * as request
import { AppModule } from '../src/app.module';

describe('Error Handling (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/test-error/generic-error (GET) - should return standardized error response', () => {
    return request(app.getHttpServer())
      .get('/api/v1/test-error/generic-error')
      .expect(500)
      .then(response => {
        expect(response.body).toEqual({
          code: 500,
          message: 'This is a generic error',
          details: expect.objectContaining({
            error_type: 'Error',
          }),
          requestId: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/v1/test-error/generic-error',
        });
      });
  });

  it('/test-error/bad-request (GET) - should return standardized error response', () => {
    return request(app.getHttpServer())
      .get('/api/v1/test-error/bad-request')
      .expect(400)
      .then(response => {
        expect(response.body).toEqual({
          code: 400,
          message: 'This is a bad request error',
          details: expect.any(Object),
          requestId: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/v1/test-error/bad-request',
        });
      });
  });

  it('/test-error/internal-server-error (GET) - should return standardized error response', () => {
    return request(app.getHttpServer())
      .get('/api/v1/test-error/internal-server-error')
      .expect(500)
      .then(response => {
        expect(response.body).toEqual({
          code: 500,
          message: 'This is an internal server error',
          details: expect.any(Object),
          requestId: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/v1/test-error/internal-server-error',
        });
      });
  });

  it('/test-error/validation-error (POST) - should return standardized validation error response', () => {
    return request(app.getHttpServer())
      .post('/api/v1/test-error/validation-error')
      .send({ invalidField: 'invalid' })
      .expect(422)
      .then(response => {
        expect(response.body).toEqual({
          code: 422,
          message: 'Validation failed',
          details: expect.objectContaining({
            errors: expect.any(Array),
          }),
          requestId: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/v1/test-error/validation-error',
        });
      });
  });

  it('/test-error/prisma-error-simulation (GET) - should return standardized Prisma error response', () => {
    return request(app.getHttpServer())
      .get('/api/v1/test-error/prisma-error-simulation')
      .expect(409)
      .then(response => {
        expect(response.body).toEqual({
          code: 409,
          message: 'Unique constraint violation',
          details: expect.objectContaining({
            target: ['email'],
            field: 'email',
          }),
          requestId: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/v1/test-error/prisma-error-simulation',
        });
      });
  });

  it('should include X-Request-ID header in response', () => {
    return request(app.getHttpServer())
      .get('/api/v1/test-error/bad-request')
      .expect(400)
      .then(response => {
        expect(response.headers).toHaveProperty('x-request-id');
        expect(response.headers['x-request-id']).toMatch(/^[A-Z0-9]+$/);
      });
  });
});
