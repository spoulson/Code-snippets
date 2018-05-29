// @flow
import TraceError from 'trace-error';

/**
 * Timeout error.
 * Used by `local/timeout` module to indicate a task timed out.
 */
export default class TimeoutError extends TraceError {
  /**
   * Create timeout error object.
   * Same arguments as TraceError().
   */
  constructor(...args: any) {
    super(...args);
    Error.captureStackTrace(this, this.constructor);
    this.name = 'TimeoutError';
    this.message = this.message || 'Timeout error.';
  }
}
