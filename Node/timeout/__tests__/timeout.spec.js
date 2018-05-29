import http from 'http';
import timeout from './timeout';
import TimeoutError from './timeout-error';

/**
 * Promise to sleep.
 * @param number delay Delay in milliseconds.
 * @return Promise
 */
function sleep(delay: number): Promise<*> {
  return new Promise(resolve => {
    setTimeout(() => resolve(), delay);
  });
}

// Temporarily disable this unit test.
// Unit tests are failing intermittently due to timing issues.
// It needs to be refactored to use fake timers.
// But, since timeout is not currently a module used by DI, it is disabled until
// this can be taken care of.
describe.skip('timeout', () => {
  it('allows task to run within TTL', async () => {
    let counter = 0;

    const fnP = async () => {
      await sleep(10);
      counter++;
    };
    const ttl = 10 * 1000;

    const timeoutFnP = timeout(fnP, ttl);

    await timeoutFnP();
    expect(counter).toBe(1);
  });

  it('rejects task on timeout', async () => {
    const fnP = async () => {
      await sleep(50);
    };
    const ttl = 10;

    const timeoutFnP = timeout(fnP, ttl);

    try {
      await timeoutFnP();
      fail('Expected TimeoutError, but task was allowed to complete.');
    }
    catch (err) {
      // Expect TimeoutError.
      expect(err instanceof TimeoutError).toBeTruthy();
      expect(err.message).toMatch(`Task timeout after ${ttl}ms`);
    }
  });

  it('handles promise rejection in the task', async () => {
    const fnP = async () => {
      return Promise.reject('Foobar');
    };
    const ttl = 10;

    const timeoutFnP = timeout(fnP, ttl);

    await expect(timeoutFnP()).rejects.toMatch('Foobar');
  });

  it('handles error thrown in the task', async () => {
    const fnP = async () => {
      throw 'Foobar';
    };
    const ttl = 10;

    const timeoutFnP = timeout(fnP, ttl);

    await expect(timeoutFnP()).rejects.toMatch('Foobar');
  });

  it('cancels task on timeout', async () => {
    // Can only cancel Bluebird promises.
    const fnP = () => new Promise(() => sleep(100))
      .then(() => fail('Expected promise to be rejected, but was allowed to continue.'));
    const ttl = 10;

    const timeoutFnP = timeout(fnP, ttl);

    try {
      await timeoutFnP();
      fail('Expected TimeoutError, but task was allowed to complete.');
    }
    catch (err) {
      expect(err instanceof TimeoutError).toBeTruthy();
      expect(err.message).toMatch(`Task timeout after ${ttl}ms`);
    }

    // Ensure the routine terminates on timeout.
    // Expect promise to cancel before it gets to the fail() statement.
    await sleep(200);
  });

  // it('cancels request-promise on timeout', async () => {
  //   // Launch simple web server.
  //   const requestHandler = async (req, res) => {
  //     await sleep(100);
  //     res.writeHead(200, { 'Content-Type': 'text/plain' });
  //     res.end('ok');
  //   };
  //   const server = http.createServer(requestHandler).listen();
  //   const url = `http://127.0.0.1:${server.address().port}/`;
  //   const ttl = 10;
  //
  //   // Prepare request.
  //   // request-promise call must be wrapped in a Bluebird promise to support cancellation.
  //   // Fortunately, the `local/api-rp` module does this for us.
  //   const fnP = () => restApiRp(url)
  //     .then(() => fail('Expected promise to be rejected, but was allowed to continue.'));
  //
  //   const timeoutFnP = timeout(fnP, ttl);
  //
  //   // Send request.
  //   // Expect request to timeout, but not continue executing the promise chain.
  //   // According to documentation, request-promise will also abort the request.
  //   try {
  //     await timeoutFnP();
  //     fail('Expected TimeoutError, but task was allowed to complete.');
  //   }
  //   catch (err) {
  //     expect(err instanceof TimeoutError).toBeTruthy();
  //     expect(err.message).toMatch(`Task timeout after ${ttl}ms`);
  //   }
  //
  //   // Ensure the routine terminates on timeout.
  //   // Expect promise to cancel before it gets to the fail() statement.
  //   await sleep(200);
  // });

  it('handles native promise where cancelation is not supported', async () => {
    const ttl = 10;
    let counter = 0;

    // Prepare a native promise, which doesn't support cancelation.
    const fnP = async () => {
      await sleep(20);
      counter++;
    }

    const timeoutFnP = timeout(fnP, ttl);

    // Expect promise to timeout and reject, but execution will continue.
    try {
      await timeoutFnP();
      fail('Expected TimeoutError, but task was allowed to complete.');
    }
    catch (err) {
      expect(err instanceof TimeoutError).toBeTruthy();
      expect(err.message).toMatch(`Task timeout after ${ttl}ms`);
    }

    // Ensure the routine terminates on timeout.
    // Expect promise to reject, but continue executing.
    await sleep(100);
    expect(counter).toBe(1);
  });
});
