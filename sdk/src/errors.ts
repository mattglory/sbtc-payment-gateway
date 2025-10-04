/**
 * Error classes for sBTC Payment Gateway SDK
 */

export class sBTCError extends Error {
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
    this.name = 'sBTCError';
    this.code = code;
    this.hint = hint;
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, sBTCError);
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

export class sBTCApiError extends sBTCError {
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
    Object.defineProperty(this, 'name', { value: 'sBTCApiError', configurable: true });
    this.status = status;
    this.response = response;
  }

  static fromResponse(response: any, status: number) {
    const error = response?.error || 'Unknown API error';
    const code = response?.code;
    const hint = response?.hint;
    const requestId = response?.requestId;

    return new sBTCApiError(error, status, code, hint, requestId, response);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      status: this.status,
      response: this.response,
    };
  }
}

export class sBTCNetworkError extends sBTCError {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR');
    Object.defineProperty(this, 'name', { value: 'sBTCNetworkError', configurable: true });
    this.cause = cause;
  }

  static fromError(error: Error) {
    return new sBTCNetworkError(
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

export class sBTCValidationError extends sBTCError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR');
    Object.defineProperty(this, 'name', { value: 'sBTCValidationError', configurable: true });
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

export class sBTCConfigurationError extends sBTCError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    Object.defineProperty(this, 'name', { value: 'sBTCConfigurationError', configurable: true });
  }
}