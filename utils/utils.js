import crypto from "crypto";

/**
 * Generates a unique sequence ID.
 * @returns {BigInt} - A unique sequence ID.
 */
export const generateUniqueSequenceId = () => {
  const timestamp = BigInt(Date.now() * 1000); // Convert to BigInt directly
  const randomBytes = crypto.randomBytes(4); // Generate 4 random bytes
  const randomNum = BigInt("0x" + randomBytes.toString("hex")); // Convert to BigInt
  return Number(timestamp + randomNum);
};

/**
 * Converts a buffer to an Int32Array.
 * @param {Buffer} buffer - The input buffer.
 * @returns {Int32Array} The resulting Int32Array.
 */
export const bufferToInt32 = (buffer) => {
  return new Int32Array(buffer.length / 4).map((_, index) =>
    buffer.readInt32LE(index * 4)
  );
};

/**
 * Converts a buffer to a Float32Array.
 * @param {Buffer} buffer - The input buffer.
 * @returns {Float32Array} The resulting Float32Array.
 */
export const bufferToFloat32 = (buffer) => {
  return new Float32Array(buffer.length / 4).map((_, index) =>
    buffer.readFloatLE(index * 4)
  );
};

/**
 * Converts a string to an array of bytes.
 * @param {string} str - The input string.
 * @returns {number[]} The resulting array of bytes.
 */
export const string2Bytes = (str) => {
  return [...str].map((char) => char.charCodeAt(0));
};

export default {
  generateUniqueSequenceId,
  bufferToInt32,
  bufferToFloat32,
  string2Bytes,
};
