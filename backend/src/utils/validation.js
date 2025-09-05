/**
 * Validation Utilities
 * Comprehensive input validation and sanitization
 */

const { ValidationError } = require('./errors');

/**
 * Validation Rules
 */
const ValidationRules = {
  // Amount validation
  amount: {
    required: true,
    type: 'number',
    min: 1000, // Minimum 1000 satoshis
    max: 21000000 * 100000000, // Maximum 21M BTC in satoshis
    message: 'Amount must be between 1,000 and 2,100,000,000,000,000 satoshis'
  },

  // Description validation
  description: {
    type: 'string',
    minLength: 1,
    maxLength: 500,
    message: 'Description must be between 1 and 500 characters'
  },

  // Email validation
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please provide a valid email address'
  },

  // Business name validation
  businessName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Business name must be between 2 and 100 characters'
  },

  // Stacks address validation
  stacksAddress: {
    required: true,
    type: 'string',
    pattern: /^S[PT][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{39}$/,
    message: 'Please provide a valid Stacks address (starting with SP or ST)'
  },

  // Transaction ID validation
  transactionId: {
    required: true,
    type: 'string',
    pattern: /^0x[a-fA-F0-9]{64}$/,
    message: 'Please provide a valid transaction ID (64 character hex string with 0x prefix)'
  },

  // API Key validation
  apiKey: {
    required: true,
    type: 'string',
    pattern: /^pk_(test|live|demo)_[a-zA-Z0-9]{32,64}$/,
    message: 'Please provide a valid API key'
  },

  // Currency validation
  currency: {
    type: 'string',
    enum: ['BTC', 'sBTC'],
    message: 'Currency must be BTC or sBTC'
  },

  // URL validation
  url: {
    type: 'string',
    pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    message: 'Please provide a valid URL'
  },

  // UUID validation
  uuid: {
    required: true,
    type: 'string',
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    message: 'Please provide a valid UUID'
  }
};

/**
 * Validator Class
 */
class Validator {
  /**
   * Validate a single field
   */
  static validateField(value, field, rules) {
    const rule = rules[field];
    
    if (!rule) {
      throw new Error(`No validation rule found for field: ${field}`);
    }

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`${field} is required`, field);
    }

    // If not required and empty, skip other validations
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return true;
    }

    // Type validation
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        throw new ValidationError(
          rule.message || `${field} must be of type ${rule.type}`,
          field
        );
      }
    }

    // Pattern validation (for strings)
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        throw new ValidationError(rule.message || `${field} format is invalid`, field);
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      throw new ValidationError(
        rule.message || `${field} must be one of: ${rule.enum.join(', ')}`,
        field
      );
    }

    // Numeric validations
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        throw new ValidationError(
          rule.message || `${field} must be at least ${rule.min}`,
          field
        );
      }
      if (rule.max !== undefined && value > rule.max) {
        throw new ValidationError(
          rule.message || `${field} must be at most ${rule.max}`,
          field
        );
      }
    }

    // String length validations
    if (rule.type === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        throw new ValidationError(
          rule.message || `${field} must be at least ${rule.minLength} characters`,
          field
        );
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        throw new ValidationError(
          rule.message || `${field} must be at most ${rule.maxLength} characters`,
          field
        );
      }
    }

    // Array validations
    if (rule.type === 'array') {
      if (rule.minItems !== undefined && value.length < rule.minItems) {
        throw new ValidationError(
          rule.message || `${field} must have at least ${rule.minItems} items`,
          field
        );
      }
      if (rule.maxItems !== undefined && value.length > rule.maxItems) {
        throw new ValidationError(
          rule.message || `${field} must have at most ${rule.maxItems} items`,
          field
        );
      }
    }

    return true;
  }

  /**
   * Validate an object against rules
   */
  static validate(data, rules = {}) {
    const errors = [];
    const validatedData = {};

    // Only use the specific rules passed, not all ValidationRules
    const validationRules = rules;

    // Get all fields to validate
    const fieldsToValidate = new Set([
      ...Object.keys(data || {}),
      ...Object.keys(validationRules).filter(key => validationRules[key].required)
    ]);

    for (const field of fieldsToValidate) {
      try {
        this.validateField(data?.[field], field, validationRules);
        if (data?.[field] !== undefined) {
          validatedData[field] = data[field];
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push({
            field: error.field,
            message: error.message,
            code: error.code
          });
        } else {
          errors.push({
            field,
            message: error.message,
            code: 'VALIDATION_ERROR'
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', null, errors);
    }

    return validatedData;
  }

  /**
   * Sanitize input data
   */
  static sanitize(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Trim whitespace
        let sanitizedValue = value.trim();
        
        // Remove null bytes
        sanitizedValue = sanitizedValue.replace(/\0/g, '');
        
        // Basic XSS prevention - escape HTML
        sanitizedValue = sanitizedValue
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');

        sanitized[key] = sanitizedValue;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => this.sanitize(item));
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate payment intent creation data
   */
  static validatePaymentIntent(data) {
    return this.validate(data, {
      amount: ValidationRules.amount,
      description: {
        ...ValidationRules.description,
        required: false
      },
      currency: {
        ...ValidationRules.currency,
        required: false
      }
    });
  }

  /**
   * Validate payment confirmation data
   */
  static validatePaymentConfirmation(data) {
    return this.validate(data, {
      customerAddress: ValidationRules.stacksAddress,
      transactionId: ValidationRules.transactionId
    });
  }

  /**
   * Validate merchant registration data
   */
  static validateMerchantRegistration(data) {
    return this.validate(data, {
      businessName: ValidationRules.businessName,
      email: ValidationRules.email,
      stacksAddress: ValidationRules.stacksAddress,
      website: {
        ...ValidationRules.url,
        required: false
      },
      description: {
        ...ValidationRules.description,
        required: false,
        maxLength: 1000
      }
    });
  }

  /**
   * Validate webhook configuration
   */
  static validateWebhook(data) {
    return this.validate(data, {
      url: ValidationRules.url,
      events: {
        type: 'array',
        required: true,
        minItems: 1,
        maxItems: 10,
        message: 'Events must be an array with 1-10 event types'
      }
    });
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(data) {
    return this.validate(data, {
      limit: {
        type: 'number',
        min: 1,
        max: 100,
        required: false,
        message: 'Limit must be between 1 and 100'
      },
      offset: {
        type: 'number',
        min: 0,
        required: false,
        message: 'Offset must be 0 or greater'
      }
    });
  }

  /**
   * Validate contract payment creation data
   */
  static validateContractPayment(data) {
    return this.validate(data, {
      amount: ValidationRules.amount,
      recipient: ValidationRules.stacksAddress,
      description: {
        ...ValidationRules.description,
        required: false
      },
      contractAddress: {
        type: 'string',
        required: false,
        pattern: /^S[PT][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{39}\.[a-zA-Z0-9-_]{1,40}$/,
        message: 'Please provide a valid contract address (address.contract-name)'
      }
    });
  }

  /**
   * Validate contract payment processing data
   */
  static validateContractPaymentProcessing(data) {
    return this.validate(data, {
      paymentId: ValidationRules.uuid,
      transactionId: ValidationRules.transactionId,
      blockHeight: {
        type: 'number',
        required: false,
        min: 1,
        message: 'Block height must be a positive number'
      }
    });
  }

  /**
   * Validate contract merchant registration data
   */
  static validateContractMerchantRegistration(data) {
    return this.validate(data, {
      merchantAddress: ValidationRules.stacksAddress,
      businessName: ValidationRules.businessName,
      email: ValidationRules.email,
      contractAddress: {
        type: 'string',
        required: false,
        pattern: /^S[PT][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{39}\.[a-zA-Z0-9-_]{1,40}$/,
        message: 'Please provide a valid contract address (address.contract-name)'
      }
    });
  }
}

/**
 * Express middleware for validation
 */
const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    try {
      // Sanitize input
      req.body = Validator.sanitize(req.body);
      
      // Validate input
      req.validatedData = Validator.validate(req.body, schema);
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  Validator,
  ValidationRules,
  createValidationMiddleware
};