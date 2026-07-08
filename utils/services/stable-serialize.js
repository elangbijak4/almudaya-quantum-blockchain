'use strict';

function normalizePrimitive(value) {
  if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  return value;
}

function sortValue(value) {
  const normalizedValue = normalizePrimitive(value);

  if (normalizedValue !== value || normalizedValue === null) {
    return normalizedValue;
  }

  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === 'object') {
    const sorted = {};

    for (const key of Object.keys(value).sort()) {
      const nestedValue = value[key];

      sorted[key] = sortValue(nestedValue);
    }

    return sorted;
  }

  return normalizedValue;
}

function stableSerialize(value) {
  return JSON.stringify(sortValue(value));
}

function cloneSerializable(value) {
  return JSON.parse(stableSerialize(value));
}

module.exports = {
  stableSerialize,
  cloneSerializable
};
