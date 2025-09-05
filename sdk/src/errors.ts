/**
 * Error classes for sBTC Payment Gateway SDK
 */

export class SBTCError extends Error {
  public readonly name: string;
  public readonly code?: string;
  public readonly hint?: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    code?: string,
    hint?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'SBTCError';
    this.code = code;
    this.hint = hint;
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SBTCError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      hint: this.hint,
      requestId: this.requestId,
      stack: this.stack,
    };
  }
}

export class SBTCApiError extends SBTCError {
  public readonly status: number;
  public readonly response?: any;

  constructor(
    message: string,
    status: number,
    code?: string,
    hint?: string,
    requestId?: string,
    response?: any
  ) {
    super(message, code, hint, requestId);
    Object.defineProperty(this, 'name', { value: 'SBTCApiError', configurable: true });
    this.status = status;
    this.response = response;
  }

  static fromResponse(response: any, status: number) {
    const error = response?.error || 'Unknown API error';
    const code = response?.code;
    const hint = response?.hint;
    const requestId = response?.requestId;

    return new SBTCApiError(error, status, code, hint, requestId, response);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      status: this.status,
      response: this.response,
    };
  }
}

export class SBTCNetworkError extends SBTCError {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR');
    Object.defineProperty(this, 'name', { value: 'SBTCNetworkError', configurable: true });
    this.cause = cause;
  }

  static fromError(error: Error) {
    return new SBTCNetworkError(
      `Network request failed: ${error.message}`,
      error
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      cause: this.cause?.message,
    };
  }
}

export class SBTCValidationError extends SBTCError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR');
    Object.defineProperty(this, 'name', { value: 'SBTCValidationError', configurable: true });
    this.field = field;
    this.value = value;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
    };
  }
}

export class SBTCConfigurationError extends SBTCError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    Object.defineProperty(this, 'name', { value: 'SBTCConfigurationError', configurable: true });
  }
}