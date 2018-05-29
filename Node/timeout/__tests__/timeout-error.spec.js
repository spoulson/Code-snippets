// @flow
import TimeoutError from 'local/timeout-error';

describe('TimeoutError', () => {
  it('can throw error', () => {
    expect(() => { throw new TimeoutError(); }).toThrowError('Timeout error');
    expect(() => { throw new TimeoutError('Foobar message'); }).toThrowError('Foobar message');
  });

  it('can throw referencing related error', () => {
    const error = new Error('Related error');
    expect(() => { throw new TimeoutError('Foobar message', error); }).toThrowError('Foobar message');
  });
});
