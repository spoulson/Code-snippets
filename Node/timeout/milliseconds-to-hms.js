// @flow
import { trimStart } from 'lodash';

/**
 * Convert milliseconds duration into HH:MM:SS formatted string.
 * @param number Milliseconds duration.
 * @return string Formatted string.
 */
export default function millisecondsToHms(d: number): string {
  d = Number(d / 1000);

  let h = `0${Math.floor(d / 3600)}`;
  h = h.length > 2 ? trimStart(h, '0') : h.slice(-2);
  const m = `0${Math.floor(d % 3600 / 60)}`.slice(-2);
  const s = `0${Math.floor(d % 3600 % 60)}`.slice(-2);

  return `${h}:${m}:${s}`;
}
