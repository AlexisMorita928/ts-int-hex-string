/**
 * Converts unsigned integers to and from hexadecimal strings with configurable
 * two's complement signed handling.
 *
 * The design choice: the library works with BigInt for the numeric side so that
 * it can cover the full unsigned range without precision loss. The signed mode
 * interprets the bit pattern as two's complement using a caller-supplied bit
 * width, which is the only way to decode a negative number from a fixed-width
 * hex string.
 */

/**
 * Validate that a value is a BigInt and is non-negative.
 * @param {bigint} value
 * @param {string} name
 */
function assertUnsignedBigInt(value, name) {
  if (typeof value !== 'bigint') {
    throw new TypeError(`${name} must be a bigint`);
  }
  if (value < 0n) {
    throw new RangeError(`${name} must be non-negative`);
  }
}

/**
 * Convert an unsigned integer to a hexadecimal string.
 *
 * @param {bigint} value - The integer to convert. Must be a non-negative bigint.
 * @param {object} [options]
 * @param {boolean} [options.signed=false] - If true, interpret `value` as a two's
 *   complement signed integer of `bits` width. Negative values are encoded as
 *   their two's complement bit pattern.
 * @param {number} [options.bits] - Bit width used for signed interpretation.
 *   Required when `signed` is true. Must be a positive integer multiple of 4
 *   (so the hex string length is exact).
 * @param {boolean} [options.prefix=false] - If true, prepend '0x'.
 * @param {boolean} [options.pad=false] - If true, left-pad the hex digits to the
 *   full width implied by `bits` (only meaningful when `bits` is provided).
 * @returns {string}
 */
export function toHex(value, options = {}) {
  const { signed = false, bits, prefix = false, pad = false } = options;

  if (typeof value !== 'bigint') {
    throw new TypeError('value must be a bigint');
  }

  let v = value;

  if (signed) {
    if (!Number.isInteger(bits) || bits <= 0) {
      throw new RangeError('bits must be a positive integer when signed is true');
    }
    if (bits % 4 !== 0) {
      throw new RangeError('bits must be a multiple of 4');
    }
    const min = -(1n << BigInt(bits - 1));
    const max = (1n << BigInt(bits - 1)) - 1n;
    if (v < min || v > max) {
      throw new RangeError(`value ${v} out of range for signed ${bits}-bit`);
    }
    if (v < 0n) {
      v = (1n << BigInt(bits)) + v;
    }
  } else {
    assertUnsignedBigInt(v, 'value');
  }

  let hex = v.toString(16);

  if (pad && bits) {
    const width = bits / 4;
    hex = hex.padStart(width, '0');
  }

  return prefix ? '0x' + hex : hex;
}

/**
 * Convert a hexadecimal string to an unsigned integer.
 *
 * @param {string} hex - The hex string. May start with '0x' or '0X'.
 * @param {object} [options]
 * @param {boolean} [options.signed=false] - If true, interpret the value as a
 *   two's complement signed integer of `bits` width.
 * @param {number} [options.bits] - Bit width used for signed interpretation.
 *   Required when `signed` is true. Must be a positive integer multiple of 4.
 * @returns {bigint}
 */
export function fromHex(hex, options = {}) {
  const { signed = false, bits } = options;

  if (typeof hex !== 'string') {
    throw new TypeError('hex must be a string');
  }

  let s = hex;
  if (s.startsWith('0x') || s.startsWith('0X')) {
    s = s.slice(2);
  }

  if (s.length === 0) {
    throw new Error('hex string is empty');
  }

  if (!/^[0-9a-fA-F]+$/.test(s)) {
    throw new Error('hex string contains invalid characters');
  }

  let v = BigInt('0x' + s);

  if (signed) {
    if (!Number.isInteger(bits) || bits <= 0) {
      throw new RangeError('bits must be a positive integer when signed is true');
    }
    if (bits % 4 !== 0) {
      throw new RangeError('bits must be a multiple of 4');
    }
    if (v >= (1n << BigInt(bits))) {
      throw new RangeError(`value out of range for ${bits}-bit`);
    }
    const signBit = 1n << BigInt(bits - 1);
    if (v & signBit) {
      v = v - (1n << BigInt(bits));
    }
  } else {
    // Unsigned mode already guaranteed non-negative by BigInt parse.
  }

  return v;
}
