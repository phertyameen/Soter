import {
  Controller,
  Get,
  Post,
  Body,
  ValidationPipe,
  BadRequestException,
  InternalServerErrorException,
  UsePipes,
} from '@nestjs/common';
import { CreateVerificationDto } from '../verification/dto/create-verification.dto';

@Controller('test-error')
export class TestErrorController {
  @Get('generic-error')
  getGenericError() {
    throw new Error('This is a generic error');
  }

  @Get('bad-request')
  getBadRequest() {
    throw new BadRequestException('This is a bad request error');
  }

  @Get('internal-server-error')
  getInternalServerError() {
    throw new InternalServerErrorException('This is an internal server error');
  }

  @Post('validation-error')
  @UsePipes(new ValidationPipe())
  postValidationError(@Body() body: CreateVerificationDto) {
    return {
      message: 'This endpoint is for testing validation errors',
      data: body,
    };
  }

  @Get('prisma-error-simulation')
  getPrismaErrorSimulation() {
    // Simulate a Prisma error
    const prismaError = new Error('Database error');
    Object.assign(prismaError, {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: {
        target: ['email'],
      },
    });
    throw prismaError;
  }
}
