// @flow
import events from 'events';

export type DeferResult = {|
  resolve: ?any => void,
  reject: ?any => void,
  promise: Promise<any>
|};

/**
 * Create a deferred promise.
 * Calls to resolve/reject will act on the promise.
 * Based on: http://bluebirdjs.com/docs/api/deferred-migration.html
 * @result Promise<DeferResult> Resolver, rejecter, and promise.
 */
export default function (): Promise<DeferResult> {
  const event = new events.EventEmitter();
  const result = {
    resolve: undefined,
    reject: undefined,
    promise: undefined
  };

  // $FlowFixMe Flow can't tell the return type.
  return new Promise(resolve => {
    // Use event to ensure no race condition whether the result object has been populated in time.
    event.once('ready', () => {
      resolve(result);
    });
    result.promise = new Promise((a, b) => {
      result.resolve = a;
      result.reject = b;
      event.emit('ready');
    });
  });
}
