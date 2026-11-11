# ts-int-hex-string

Converts unsigned integers to and from hexadecimal strings with configurable two's complement signed handling.

```js
import { toHex, fromHex } from 'ts-int-hex-string';

toHex(255n); // 'ff'
toHex(-1n, { signed: true, bits: 8 }); // 'ff'
fromHex('ff', { signed: true, bits: 8 }); // -1n
```

## Why this library exists

JavaScript's built-in `Number.prototype.toString(16)` loses precision above 2^53,
and its `parseInt` cannot represent negative two's complement values. This library
uses `BigInt` throughout so the full unsigned range is exact, and it makes the
signed interpretation explicit: you must supply a bit width, because a hex string
like `'ff'` is only negative if you know it came from an 8-bit two's complement
field. The trade-off is that signed mode requires the caller to know the bit width;
there is no guessing.

## The awkward edge

When `signed` is true, `bits` must be a positive multiple of 4. That keeps the
hex string length exact (one hex digit per 4 bits) and avoids ambiguous padding.
If you have an odd bit width, pad your storage to the next multiple of 4 and pass
that width.

## API

### `toHex(value, options?)`

- `value` (bigint): the integer to convert.
- `options.signed` (boolean, default `false`): interpret as two's complement.
- `options.bits` (number): required when `signed` is true; positive multiple of 4.
- `options.prefix` (boolean, default `false`): prepend `'0x'`.
- `options.pad` (boolean, default `false`): left-pad to the width implied by `bits`.

Returns a lowercase hex string without leading zeros unless `pad` is true.

### `fromHex(hex, options?)`

- `hex` (string): may start with `'0x'` or `'0X'`.
- `options.signed` (boolean, default `false`): interpret as two's complement.
- `options.bits` (number): required when `signed` is true; positive multiple of 4.

Returns a bigint. Throws on empty strings, invalid characters, or values that
do not fit in the given bit width.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

