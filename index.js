const Base64 = (function() {
  const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
  const dict = {};
  for (let i = 0; i < symbols.length; i++) {
    dict[symbols[i]] = i;
  }

  function Encoder() {
    let encoded = '',
        place = 6,
        value = 0;

    /**
     * Converts an integer to k-bit unsigned binary, and appends it to the end of the bit stream.
     * 
     * Examples:
     * 1. push(33, 6): appends '100001' to the stream.
     * 2. push(33, 8): appends '00100001' to the stream.
     * 
     * @param {number} binary Unsigned binary in decimal.
     * @param {number} k Number of bits.
     */
    function push(binary, k) {
      if (binary < 0) {
        throw new Error('Binary must be unsigned.');
      }
      if (k === undefined) {
        k = 8
      }
      if (binary >= 2 ** k) {
        throw new Error('Invalid bit size.');
      }
      while (k > 0) {
        k -= 1;
        place -= 1;
        value += ((binary & (1 << k)) >> k) << place;
        if (place === 0) {
          encoded += symbols[value];
          place = 6;
          value = 0;
        }
      }
    };

    /**
     * Encodes the bit stream to base64 format, and resets the encoder.
     * @returns Base64 encoded string.
     */
    function flush() {
      let result = encoded;
      encoded = '';
      if (place !== 6) {
        result += symbols[value];
        place = 6;
        value = 0;
      }
      switch (result.length % 4) {
        case 1:
          result += '===';
          break;
        case 2:
          result += '==';
          break;
        case 3:
          result += '=';
          break;
        default:
          break;
      }
      return result;
    };
  
    return {
      push,
      flush,
    };
  }

  function Decoder() {
    let availableBits = 0, // the number of available bits for the input.
        input = '',
        padding = 0, // the number of bits that is used as padding.
        pos = 0, // current symbol position.
        redisual = 6; // the number of available bits in the current symbol.

    /**
     * Loads a base64 encoded string to the decoder, and replaces the existing one.
     * @param {string} base64 Base64 encoded string.
     */
    function from(base64) {
      if (typeof base64 !== 'string' || base64.length % 4 !== 0) {
        throw new Error('Invalid base64 input.');
      }
      const match = base64.match(/=+/);
      if (match) {
        base64 = base64.slice(0, match.index);
      }
      padding = (base64.length * 6) % 8; // 0, 2, 4, 6
      if (padding === 6) {
        base64 = base64.slice(0, -1);
        padding = 0;
      }
      availableBits = base64.length * 6 - padding;
      input = base64;
      pos = 0;
      redisual = 6;
    }

    /**
     * Extracts the next k bits and converts it to decimal.
     * @param {number} k The number of bits, at most 32.
     * @returns The next k bits in decimal.
     */
    function pop(k) {
      if (availableBits <= 0) {
        return null;
      }
      if (k === undefined) {
        k = 8;
      }
      var bits = 0, value = dict[input.charAt(pos)];
      if (typeof value !== 'number') {
        throw new Error('Encounter invalid base64 symbol.');
      }
      k = Math.min(k, availableBits);
      while (k > 0) {
        availableBits -= 1;
        redisual -= 1;
        k -= 1;
        bits += ((value & (1 << redisual)) >> redisual) << k;
        if (availableBits === 0) {
          break;
        } else if (redisual === 0) {
          redisual = 6;
          pos += 1;
          value = dict[input.charAt(pos)];
        }
      }
      return bits;
    }

    /**
     * Resets the bit position by skipping the first k bits.
     * @param {number} k The number of bits to be skipped.
     */
    function offset(k) {
      if (k === undefined) {
        k = 0;
      }
      pos = Math.floor(k / 6);
      redisual = 6 - k % 6;
      availableBits = redisual + (input.length - 1 - pos) * 6 - padding;
    };
  
    return {
      from,
      pop,
      offset,
    };
  }

  return {
    Decoder,
    Encoder,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Base64;
}