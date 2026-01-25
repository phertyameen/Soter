import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

export interface ErrorResponse {
  code: string | number;
  message: string;
  details?: any;
  requestId?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string;

    // Log the error
    this.logger.error(
      `Request ID: ${requestId} | ${exception.constructor.name} | Status: ${
        exception.status || HttpStatus.INTERNAL_SERVER_ERROR
      } | Message: ${exception.message} | Path: ${request.url}`,
      exception.stack,
    );

    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      errorResponse = this.handleHttpException(exception, request, requestId);
    } else if (this.isPrismaError(exception)) {
      errorResponse = this.handlePrismaError(exception, request, requestId);
    } else if (
      Array.isArray(exception) &&
      exception.some(e => e instanceof ValidationError)
    ) {
      errorResponse = this.handleValidationErrors(
        exception,
        request,
        requestId,
      );
    } else {
      errorResponse = this.handleGenericError(exception, request, requestId);
    }

    response.status(errorResponse.code as number).json(errorResponse);
  }

  private handleHttpException(
    exception: HttpException,
    request: Request,
    requestId: string,
  ): ErrorResponse {
    const status = exception.getStatus();
    const message = exception.message || exception.getResponse();

    return {
      code: status,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      details: exception.getResponse(),
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private isPrismaError(exception: any): boolean {
    return (
      exception?.constructor?.name?.includes('Prisma') ||
      exception?.clientVersion ||
      exception?.meta?.target
    );
  }

  private handlePrismaError(
    exception: any,
    request: Request,
    requestId: string,
  ): ErrorResponse {
    let code = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let details: any = null;

    // Map common Prisma errors
    if (exception.code === 'P2002') {
      // Unique constraint failed
      code = HttpStatus.CONFLICT;
      message = 'Unique constraint violation';
      details = {
        target: exception.meta?.target,
        field: Array.isArray(exception.meta?.target)
          ? exception.meta.target.join(', ')
          : exception.meta?.target,
      };
    } else if (exception.code === 'P2025') {
      // Record not found
      code = HttpStatus.NOT_FOUND;
      message = 'Record not found';
      details = {
        cause: exception.meta?.cause,
      };
    } else if (exception.code === 'P2003') {
      // Foreign key constraint failed
      code = HttpStatus.BAD_REQUEST;
      message = 'Foreign key constraint violation';
      details = {
        field_name: exception.meta?.field_name,
      };
    } else if (exception.code === 'P2000') {
      // Value too long for column
      code = HttpStatus.BAD_REQUEST;
      message = 'Value too long for column';
      details = {
        column_name: exception.meta?.column_name,
      };
    } else {
      details = {
        code: exception.code,
        meta: exception.meta,
      };
    }

    return {
      code,
      message,
      details,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private handleValidationErrors(
    exceptions: ValidationError[],
    request: Request,
    requestId: string,
  ): ErrorResponse {
    const validationErrors = exceptions.map(error => ({
      property: error.property,
      value: error.value,
      constraints: error.constraints,
      children: error.children?.length
        ? this.formatChildren(error.children)
        : undefined,
    }));

    return {
      code: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      details: {
        errors: validationErrors,
      },
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private formatChildren(children: ValidationError[]): any[] {
    return children.map(child => ({
      property: child.property,
      value: child.value,
      constraints: child.constraints,
      children: child.children?.length
        ? this.formatChildren(child.children)
        : undefined,
    }));
  }

  private handleGenericError(
    exception: any,
    request: Request,
    requestId: string,
  ): ErrorResponse {
    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message || 'Internal server error',
      details: {
        error_type: exception.constructor?.name,
        ...(typeof process !== 'undefined' &&
          process.env.NODE_ENV === 'development' && {
            stack: exception.stack,
          }),
      },
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }
}
