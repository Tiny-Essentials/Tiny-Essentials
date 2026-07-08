import { Buffer } from 'buffer';

export default [
  [
    'buffer',
    /** @param {*} val @returns {val is Buffer} */
    (val) => typeof Buffer !== 'undefined' && Buffer.isBuffer(val),
  ],
];
