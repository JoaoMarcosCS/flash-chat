export class AppException extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundException extends AppException {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictException extends AppException {
  constructor(message: string) {
    super(message, 409);
  }
}

export class InternalServerException extends AppException {
  constructor(message: string) {
    super(message, 500);
  }
}

export class BadRequestException extends AppException {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string) {
    super(message, 403);
  }
}

export class TooManyRequestsException extends AppException {
  constructor(message: string) {
    super(message, 429);
  }
}

export class ServiceUnavailableException extends AppException {
  constructor(message: string) {
    super(message, 503);
  }
}
