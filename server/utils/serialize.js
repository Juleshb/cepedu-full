const { Prisma } = require('@prisma/client');

/** Convert Prisma Decimal / BigInt values so Express can JSON-serialize them. */
function serialize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return Number(value);
  if (Prisma.Decimal.isDecimal(value)) return Number(value);
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = serialize(val);
    }
    return out;
  }
  return value;
}

module.exports = { serialize };
