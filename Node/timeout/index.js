// Run a promise with a timeout.
// On timeout and if promise is a Bluebird promise, will also call its cancel()
// function to try to stop execution.
// If not a Bluebird promise, promise will reject, but underlying execution will continue.
//
// @flow
/* eslint-disable max-len */
import bluebird from 'bluebird';
import {
  isFunction,
  isNil
} from 'lodash';
import asyncTimeout from 'async/timeout';
import millisecondsToHms from './milliseconds-to-hms';
import TimeoutError from './timeout-error';

type SaveStateFunction = (timeoutPromise: Promise<*>, e: Error) => void;
type PromiseFunction = (*) => Promise<*>;

/**
 * General work procedure for timeout().
 * @param PromiseFunction fnP Task function.
 * @param any[] args Arguments to task function.
 * @param number ttl TTL for this task in milliseconds.
 * @param SaveStateFunction saveStateFunction Callback for saving task state.
 * @param Function callback Callback to indicate task is complete.
 * @return Promise<*> Promise to task completion.
 * */
function timeoutWorkProc(fnP: PromiseFunction, args: any[], ttl: number, saveState: SaveStateFunction, callback: Function): Promise<*> {
  // Launch task inside Bluebird promise.
  // Bluebird promise is required to support cancellation.
  let taskResult;
  let error = null;
  const promise = bluebird.resolve(fnP(...args))
    .then(result => { taskResult = result; })
    .catch(e => { error = e; })
    .then(() => callback(error, taskResult));

  // Return state to timeout routine:
  // - Promise to timeout routine.
  // - Error containing runtime stack.  The error will be thrown on timeout.
  const timeString = ttl < 1000 ? `${ttl}ms` : millisecondsToHms(ttl);
  const errorMessage = new TimeoutError(`Task timeout after ${timeString}.`, { args });
  saveState(promise, errorMessage);

  return promise;
}

/**
 * Wrap a Promise function with timeout using async/timeout.
 * If the promise times out, the running promise will be rejected and canceled.
 * Cancelation will only have an effect if fnP returns a Bluebird promise.
 * Otherwise, the timed out promise will continue to execute in the background.
 *
 * @param PromiseFunction fnP Promise function.
 * @param number ttl Timeout in milliseconds.
 * @return PromiseFunction Wrapped Promise function.
 */
export default function timeout(fnP: PromiseFunction, ttl: number): PromiseFunction {
  return (...args: any[]) => new bluebird((resolve, reject) => {
    // Wrap timeoutWorkProc with timeout management.
    const fnTimeout = asyncTimeout(timeoutWorkProc, ttl);

    // Call fnTimeout and resolve or reject the promise.
    let promise;
    let taskError;
    const saveStateCallback: SaveStateFunction = (timeoutPromise, e) => {
      promise = timeoutPromise;
      taskError = e;
    };

    // Launch fnP in timeout procedure.
    fnTimeout(fnP, args, ttl, saveStateCallback, (err, resultP) => {
      if (isNil(err)) {
        // Task completed successfully.
        return resolve(resultP);
      }

      // Handle error.
      if (err instanceof Error && err.code === 'ETIMEDOUT') {
        // Reject promise on timeout.
        // Reject using task's Error object, which contains relevant stack trace.
        reject(taskError);
      } else {
        // Reject promise due to runtime error.
        reject(err);
      }

      // Cancel promise execution, if possible.
      // $FlowFixMe Testing if promise is a Bluebird promise.
      if (promise && isFunction(promise.cancel)) {
        promise.cancel();
      }
    });
  });
}
