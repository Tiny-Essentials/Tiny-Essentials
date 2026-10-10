/**
 * @fileoverview Probes the intrinsic dimensions of a video stream by parsing
 * its container header. It never decodes a frame, so it works for codecs the
 * browser cannot play.
 *
 * Supported containers: ISO base media (MP4, MOV, M4V, 3GP), Matroska/WebM,
 * AVI, AMV, Ogg/Theora, MPEG-1/2 elementary streams, MPEG program streams
 * (VOB), MPEG transport streams (TS, MTS, M2TS), FLV, ASF/WMV, RealMedia,
 * NSV and RoQ.
 *
 * Note on production usage for MP4: Ensure your videos are optimized for web streaming
 * (e.g., encoded with ffmpeg `-movflags faststart`). This places the `moov` atom at the
 * beginning of the file, allowing the probe to resolve dimensions within the first few kilobytes
 * instead of requiring the entire file to be loaded into memory.
 */
import TinyBufferReader, { TinyNeedMoreData } from '../utils/TinyBufferReader.mjs';
import { findBox } from '../utils/TinyIsoBox.mjs';

/**
 * @typedef {Object} MediaProbeSize
 * @property {number} width - The display width in pixels.
 * @property {number} height - The display height in pixels.
 */

/**
 * A container descriptor.
 * @typedef {Object} MediaFormat
 * @property {string} name - The container identifier.
 * @property {(bytes: Uint8Array) => boolean} sniff - The signature test.
 * @property {(reader: TinyBufferReader) => MediaProbeSize | null} parse - The parser.
 */

/**
 * The largest header the probe buffers before giving up.
 * @type {number}
 */
const MAX_HEADER_BYTES = 8 * 1024 * 1024;

/**
 * The EBML element identifiers the WebM parser descends into.
 * @type {ReadonlySet<number>}
 */
const WEBM_CONTAINERS = new Set([0x18538067, 0x1654ae6b, 0xae, 0xe0]);

/**
 * The H.264 profiles that carry the extra `chroma_format_idc` fields.
 * @type {ReadonlySet<number>}
 */
const HIGH_PROFILES = new Set([100, 110, 122, 244, 44, 83, 86, 118, 128, 138, 139, 134, 135]);

/**
 * @param {Uint8Array} bytes - The buffer to test.
 * @param {readonly number[]} signature - The expected prefix.
 * @param {number} [offset] - The offset to test at.
 * @returns {boolean} True when the buffer starts with the signature.
 */
function matches(bytes, signature, offset = 0) {
  if (bytes.length < offset + signature.length) {
    return false;
  }
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * Strips the H.264 emulation prevention bytes from a NAL unit.
 * @param {Uint8Array} data - The raw NAL unit.
 * @returns {Uint8Array} The unescaped NAL unit.
 */
function unescapeNal(data) {
  const output = new Uint8Array(data.length);
  let size = 0;
  for (let i = 0; i < data.length; i += 1) {
    if (i >= 2 && data[i] === 0x03 && data[i - 1] === 0x00 && data[i - 2] === 0x00) {
      continue;
    }
    output[size] = data[i];
    size += 1;
  }
  return output.subarray(0, size);
}

/**
 * Reads the picture size from an H.264 SPS NAL unit.
 * @param {Uint8Array} data - The SPS NAL unit, including its 1-byte NAL header.
 * @returns {MediaProbeSize|null} The dimensions, or null when the SPS is malformed.
 */
function readH264Sps(data) {
  const bytes = unescapeNal(data);
  let bit = 0;
  const readBit = () => (bytes[bit >> 3] >> (7 - (bit++ & 7))) & 1;
  /** @param {number} count */
  const readBits = (count) => {
    let value = 0;
    for (let i = 0; i < count; i += 1) {
      value = (value << 1) | readBit();
    }
    return value;
  };
  const readUe = () => {
    let zeros = 0;
    while (readBit() === 0) {
      zeros += 1;
      if (zeros > 32) {
        throw new RangeError('Invalid Exp-Golomb code.');
      }
    }
    return (1 << zeros) - 1 + (zeros > 0 ? readBits(zeros) : 0);
  };
  const readSe = () => {
    const value = readUe();
    return value & 1 ? (value + 1) >> 1 : -(value >> 1);
  };
  readBits(8);
  const profileIdc = readBits(8);
  readBits(8);
  readBits(8);
  readUe();
  if (HIGH_PROFILES.has(profileIdc)) {
    const chromaFormatIdc = readUe();
    if (chromaFormatIdc === 3) {
      readBit();
    }
    readUe();
    readUe();
    readBit();
    if (readBit() === 1) {
      const count = chromaFormatIdc !== 3 ? 8 : 12;
      for (let i = 0; i < count; i += 1) {
        if (readBit() === 1) {
          let lastScale = 8;
          let nextScale = 8;
          const size = i < 6 ? 16 : 64;
          for (let j = 0; j < size; j += 1) {
            if (nextScale !== 0) {
              nextScale = (lastScale + readSe() + 256) % 256;
            }
            lastScale = nextScale === 0 ? lastScale : nextScale;
          }
        }
      }
    }
  }
  readUe();
  const picOrderCntType = readUe();
  if (picOrderCntType === 0) {
    readUe();
  } else if (picOrderCntType === 1) {
    readBit();
    readSe();
    readSe();
    const num = readUe();
    for (let i = 0; i < num; i += 1) {
      readSe();
    }
  }
  readUe();
  readBit();
  const widthMbs = readUe() + 1;
  const heightMapUnits = readUe() + 1;
  const frameMbsOnly = readBit();
  if (frameMbsOnly === 0) {
    readBit();
  }
  readBit();
  let cropLeft = 0;
  let cropRight = 0;
  let cropTop = 0;
  let cropBottom = 0;
  if (readBit() === 1) {
    cropLeft = readUe();
    cropRight = readUe();
    cropTop = readUe();
    cropBottom = readUe();
  }
  const width = widthMbs * 16 - (cropLeft + cropRight) * 2;
  const height = (2 - frameMbsOnly) * heightMapUnits * 16 - (cropTop + cropBottom) * 2;
  return width > 0 && height > 0 ? { width, height } : null;
}

/* -------------------------------------------------------------------------- */
/* ISO base media file format (MP4, MOV, M4V, 3GP, 3G2)                       */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseIsoBmff(reader) {
  const end = reader.limit;
  const moov = findBox(reader, 0, end, new Set(['moov']));
  if (moov) {
    let cursor = moov.dataStart;
    while (cursor + 8 <= moov.dataEnd) {
      reader.seek(cursor);
      const size = reader.uint32();
      const type = reader.ascii(4);
      if (size < 8) {
        break;
      }
      if (type === 'trak') {
        const tkhd = findBox(reader, cursor + 8, cursor + size, new Set(['tkhd']));
        if (tkhd) {
          const version = reader.seek(tkhd.dataStart).uint8();
          reader.seek(tkhd.start + (version === 1 ? 96 : 84));
          const width = reader.uint32() / 65536;
          const height = reader.uint32() / 65536;
          if (width > 0 && height > 0) {
            return { width: Math.round(width), height: Math.round(height) };
          }
        }
      }
      cursor += size;
    }
  }
  const ispe = findBox(reader, 0, end, new Set(['ispe']));
  if (ispe) {
    reader.seek(ispe.dataStart + 4);
    const width = reader.uint32();
    const height = reader.uint32();
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Matroska / WebM                                                            */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseWebm(reader) {
  return scanWebm(reader, 0, reader.limit);
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} start - The first byte of the range.
 * @param {number} end - The byte after the range.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function scanWebm(reader, start, end) {
  let offset = start;
  while (offset < end) {
    const id = readVint(reader, offset, true);
    if (!id) {
      return null;
    }
    const size = readVint(reader, offset + id.length, false);
    if (!size) {
      return null;
    }
    const dataStart = offset + id.length + size.length;
    const dataEnd = dataStart + size.value;
    if (dataEnd > end) {
      return null;
    }
    if (id.value === 0xe0) {
      return readWebmVideo(reader, dataStart, dataEnd);
    }
    if (WEBM_CONTAINERS.has(id.value)) {
      const result = scanWebm(reader, dataStart, dataEnd);
      if (result) {
        return result;
      }
    }
    offset = dataEnd;
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} start - The first byte of the `Video` payload.
 * @param {number} end - The byte after the `Video` payload.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function readWebmVideo(reader, start, end) {
  let width = 0;
  let height = 0;
  let offset = start;
  while (offset < end) {
    const id = readVint(reader, offset, true);
    if (!id) {
      return null;
    }
    const size = readVint(reader, offset + id.length, false);
    if (!size) {
      return null;
    }
    const dataStart = offset + id.length + size.length;
    const dataEnd = dataStart + size.value;
    if (dataEnd > end) {
      return null;
    }
    if (id.value === 0xb0) {
      width = readUint(reader, dataStart, size.value);
    } else if (id.value === 0xba) {
      height = readUint(reader, dataStart, size.value);
    }
    offset = dataEnd;
  }
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} offset - The first byte of the integer.
 * @param {boolean} keepMarker - Whether the length marker bit is preserved.
 * @returns {{ value: number, length: number }|null} The decoded value and its byte length.
 */
function readVint(reader, offset, keepMarker) {
  const bytes = reader.buffer;
  if (offset >= bytes.length) {
    return null;
  }
  const first = bytes[offset];
  if (first === 0) {
    return null;
  }
  let length = 1;
  let mask = 0x80;
  while (length <= 8 && !(first & mask)) {
    mask >>= 1;
    length += 1;
  }
  if (length > 8 || offset + length > bytes.length) {
    return null;
  }
  let value = keepMarker ? first : first & (mask - 1);
  for (let i = 1; i < length; i += 1) {
    value = value * 256 + bytes[offset + i];
  }
  return { value, length };
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} offset - The first byte of the integer.
 * @param {number} length - The number of bytes to read.
 * @returns {number} The decoded value.
 */
function readUint(reader, offset, length) {
  const bytes = reader.buffer;
  let value = 0;
  for (let i = 0; i < length; i += 1) {
    value = value * 256 + bytes[offset + i];
  }
  return value;
}

/* -------------------------------------------------------------------------- */
/* AVI / AMV                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseAvi(reader) {
  const end = reader.limit;
  let offset = 12;
  while (offset + 8 <= end) {
    reader.seek(offset);
    const id = reader.ascii(4);
    const size = reader.uint32le();
    if (id === 'avih') {
      reader.seek(offset + 8 + 32);
      const width = reader.uint32le();
      const height = reader.uint32le();
      return width > 0 && height > 0 ? { width, height } : null;
    }
    offset += 8 + size + (size % 2);
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseAmv(reader) {
  const end = reader.limit;
  let offset = 12;
  while (offset + 8 <= end) {
    reader.seek(offset);
    const id = reader.ascii(4);
    const size = reader.uint32le();
    if (id === 'amvh') {
      reader.seek(offset + 8 + 32);
      const width = reader.uint32le();
      const height = reader.uint32le();
      return width > 0 && height > 0 ? { width, height } : null;
    }
    offset += 8 + size + (size % 2);
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Ogg / Theora                                                               */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseOgg(reader) {
  reader.seek(26);
  const segments = reader.uint8();
  reader.skip(segments);
  const payload = reader.offset;
  reader.seek(payload);
  if (reader.ascii(7) !== '\x80theora') {
    return null;
  }
  reader.seek(payload + 10);
  const width = reader.uint24();
  const height = reader.uint24();
  return width > 0 && height > 0 ? { width, height } : null;
}

/* -------------------------------------------------------------------------- */
/* MPEG-1/2 elementary stream                                                 */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseMpeg(reader) {
  const end = reader.limit;
  for (let offset = 0; offset + 12 <= end; offset += 1) {
    reader.seek(offset);
    if (reader.uint24() !== 0x000001 || reader.uint8() !== 0xb3) {
      continue;
    }
    const a = reader.uint8();
    const b = reader.uint8();
    const c = reader.uint8();
    const width = (a << 4) | (b >> 4);
    const height = ((b & 0x0f) << 8) | c;
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* FLV (FLV, F4V, F4P, F4A, F4B)                                              */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseFlv(reader) {
  reader.seek(5);
  let offset = reader.uint32();
  const end = reader.limit;
  while (offset + 11 <= end) {
    reader.seek(offset);
    const tagType = reader.uint8();
    const dataSize = reader.uint24();
    reader.skip(7);
    const dataStart = reader.offset;
    if (tagType === 9) {
      const size = readFlvVideo(reader, dataStart, dataStart + dataSize);
      if (size) {
        return size;
      }
    }
    offset = dataStart + dataSize + 4;
  }
  return null;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} start - The first byte of the video tag payload.
 * @param {number} end - The byte after the video tag payload.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function readFlvVideo(reader, start, end) {
  if (start + 16 > end) {
    return null;
  }
  reader.seek(start);
  if ((reader.uint8() & 0x0f) !== 7) {
    return null;
  }
  if (reader.uint8() !== 0) {
    return null;
  }
  reader.skip(5);
  if ((reader.uint8() & 0x1f) === 0) {
    return null;
  }
  const spsLength = reader.uint16();
  try {
    return readH264Sps(reader.bytes(spsLength));
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* MPEG program stream (VOB)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseMpegPs(reader) {
  const end = reader.limit;
  for (let offset = 0; offset + 12 <= end; offset += 1) {
    reader.seek(offset);
    if (reader.uint24() !== 0x000001 || reader.uint8() !== 0xb3) {
      continue;
    }
    const a = reader.uint8();
    const b = reader.uint8();
    const c = reader.uint8();
    const width = (a << 4) | (b >> 4);
    const height = ((b & 0x0f) << 8) | c;
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* MPEG transport stream (TS, MTS, M2TS)                                      */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseMpegTs(reader) {
  const end = reader.limit;
  const base = findTsSync(reader, end);
  if (base === -1) {
    return null;
  }
  const pmtPid = findTsPmtPid(reader, base, end);
  if (pmtPid === -1) {
    return null;
  }
  const videoPid = findTsVideoPid(reader, base, end, pmtPid);
  if (videoPid === -1) {
    return null;
  }
  return findTsSps(reader, base, end, videoPid);
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} end - The byte after the buffer.
 * @returns {number} The offset of the first sync byte, or -1.
 */
function findTsSync(reader, end) {
  for (let offset = 0; offset + 376 < Math.min(end, 8192); offset += 1) {
    if (reader.seek(offset).uint8() !== 0x47) {
      continue;
    }
    if (reader.seek(offset + 188).uint8() === 0x47 && reader.seek(offset + 376).uint8() === 0x47) {
      return offset;
    }
  }
  return -1;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} base - The offset of the first sync byte.
 * @param {number} end - The byte after the buffer.
 * @returns {number} The PMT PID, or -1.
 */
function findTsPmtPid(reader, base, end) {
  for (let offset = base; offset + 188 <= end; offset += 188) {
    reader.seek(offset);
    if (reader.uint8() !== 0x47) {
      continue;
    }
    const flags = reader.uint8();
    const pid = ((flags & 0x1f) << 8) | reader.uint8();
    if (pid !== 0) {
      continue;
    }
    reader.skip(1);
    const pointer = reader.uint8();
    reader.skip(pointer);
    if (reader.uint8() !== 0x00) {
      continue;
    }
    reader.skip(2);
    reader.skip(3);
    const programCount = (reader.uint8() << 8) | reader.uint8();
    for (let i = 0; i < programCount; i += 1) {
      reader.skip(2);
      const pmtPid = ((reader.uint8() & 0x1f) << 8) | reader.uint8();
      return pmtPid;
    }
  }
  return -1;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} base - The offset of the first sync byte.
 * @param {number} end - The byte after the buffer.
 * @param {number} pmtPid - The PMT PID.
 * @returns {number} The video PID, or -1.
 */
function findTsVideoPid(reader, base, end, pmtPid) {
  for (let offset = base; offset + 188 <= end; offset += 188) {
    reader.seek(offset);
    if (reader.uint8() !== 0x47) {
      continue;
    }
    const flags = reader.uint8();
    const pid = ((flags & 0x1f) << 8) | reader.uint8();
    if (pid !== pmtPid) {
      continue;
    }
    reader.skip(1);
    const pointer = reader.uint8();
    reader.skip(pointer);
    if (reader.uint8() !== 0x02) {
      continue;
    }
    const sectionLength = reader.uint16() & 0x03ff;
    const sectionEnd = reader.offset + sectionLength - 4;
    reader.skip(5);
    while (reader.offset + 5 <= sectionEnd) {
      const streamType = reader.uint8();
      const elementaryPid = reader.uint16() & 0x1fff;
      reader.skip(2);
      if (streamType === 0x1b || streamType === 0x02) {
        return elementaryPid;
      }
    }
  }
  return -1;
}

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @param {number} base - The offset of the first sync byte.
 * @param {number} end - The byte after the buffer.
 * @param {number} pid - The video PID.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function findTsSps(reader, base, end, pid) {
  const payload = [];
  for (let offset = base; offset + 188 <= end; offset += 188) {
    reader.seek(offset);
    if (reader.uint8() !== 0x47) {
      continue;
    }
    const flags = reader.uint8();
    const packetPid = ((flags & 0x1f) << 8) | reader.uint8();
    if (packetPid !== pid) {
      continue;
    }
    const start = reader.offset + 1 + reader.buffer[reader.offset];
    for (let i = start; i < offset + 188; i += 1) {
      payload.push(reader.buffer[i]);
    }
  }
  for (let i = 0; i + 4 < payload.length; i += 1) {
    if (
      payload[i] === 0 &&
      payload[i + 1] === 0 &&
      payload[i + 2] === 1 &&
      (payload[i + 3] & 0x1f) === 7
    ) {
      try {
        return readH264Sps(Uint8Array.from(payload.slice(i + 3)));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* ASF (WMV, ASF)                                                             */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseAsf(reader) {
  const end = reader.limit;
  const guid = [
    0xc0, 0xef, 0x19, 0xbc, 0x4d, 0x4b, 0xcf, 0x11, 0xa8, 0xfd, 0x00, 0x80, 0x5f, 0x5c, 0x44, 0x2b,
  ];
  for (let offset = 0; offset + 16 <= end; offset += 1) {
    reader.seek(offset);
    if (!guid.every((byte) => reader.uint8() === byte)) {
      continue;
    }
    reader.skip(24);
    const width = reader.uint32le();
    const height = reader.uint32le();
    if (width > 0 && height > 0 && width < 65536 && height < 65536) {
      return { width, height };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* RealMedia (RM, RMVB)                                                       */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseRealMedia(reader) {
  const end = reader.limit;
  for (let offset = 0; offset + 12 <= end; offset += 1) {
    reader.seek(offset);
    if (reader.ascii(4) !== 'VIDO') {
      continue;
    }
    reader.skip(6);
    const width = reader.uint16();
    const height = reader.uint16();
    if (width > 0 && height > 0 && width < 65536 && height < 65536) {
      return { width, height };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* NSV                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseNsv(reader) {
  const end = reader.limit;
  for (let offset = 0; offset + 16 <= end; offset += 1) {
    reader.seek(offset);
    if (reader.ascii(4) !== 'NSVs') {
      continue;
    }
    reader.skip(4);
    const width = reader.uint16le();
    const height = reader.uint16le();
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* RoQ                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * @param {TinyBufferReader} reader - The cursor.
 * @returns {MediaProbeSize|null} The dimensions.
 */
function parseRoq(reader) {
  reader.seek(8);
  const width = reader.uint16le();
  const height = reader.uint16le();
  return width > 0 && height > 0 ? { width, height } : null;
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The container registry. The order matters: the first signature that matches wins.
 * @type {ReadonlyArray<MediaFormat>}
 */
const FORMATS = Object.freeze([
  { name: 'iso-bmff', sniff: (b) => matches(b, [0x66, 0x74, 0x79, 0x70], 4), parse: parseIsoBmff },
  { name: 'matroska', sniff: (b) => matches(b, [0x1a, 0x45, 0xdf, 0xa3]), parse: parseWebm },
  {
    name: 'amv',
    sniff: (b) => matches(b, [0x52, 0x49, 0x46, 0x46]) && matches(b, [0x41, 0x4d, 0x56, 0x20], 8),
    parse: parseAmv,
  },
  {
    name: 'avi',
    sniff: (b) => matches(b, [0x52, 0x49, 0x46, 0x46]) && matches(b, [0x41, 0x56, 0x49, 0x20], 8),
    parse: parseAvi,
  },
  { name: 'ogg', sniff: (b) => matches(b, [0x4f, 0x67, 0x67, 0x53]), parse: parseOgg },
  { name: 'flv', sniff: (b) => matches(b, [0x46, 0x4c, 0x56, 0x01]), parse: parseFlv },
  {
    name: 'asf',
    sniff: (b) => matches(b, [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11]),
    parse: parseAsf,
  },
  { name: 'realmedia', sniff: (b) => matches(b, [0x2e, 0x52, 0x4d, 0x46]), parse: parseRealMedia },
  { name: 'nsv', sniff: (b) => matches(b, [0x4e, 0x53, 0x56, 0x66]), parse: parseNsv },
  { name: 'roq', sniff: (b) => matches(b, [0x84, 0x10, 0xff, 0xff]), parse: parseRoq },
  {
    name: 'mpeg-ts',
    sniff: (b) => b[0] === 0x47 && b[188] === 0x47 && b[376] === 0x47,
    parse: parseMpegTs,
  },
  { name: 'mpeg-ps', sniff: (b) => matches(b, [0x00, 0x00, 0x01, 0xba]), parse: parseMpegPs },
  { name: 'mpeg', sniff: (b) => matches(b, [0x00, 0x00, 0x01, 0xb3]), parse: parseMpeg },
]);

/**
 * Reads the intrinsic dimensions of a video stream from its container header.
 */
class TinyMediaProbe {
  /** @type {Uint8Array} */
  #buffer = new Uint8Array(0);
  /** @type {MediaFormat|null} */
  #format = null;
  /** @type {boolean} */
  #resolved = false;
  /** @type {boolean} */
  #abandoned = false;
  /** @type {number} */
  #maxBytes;

  /**
   * @param {string} [type] - The MIME type from the response headers. Unused, kept for API compatibility.
   * @param {number} [maxBytes] - The maximum number of header bytes to buffer.
   * @throws {RangeError} If `maxBytes` is not a positive number.
   */
  constructor(type = '', maxBytes = MAX_HEADER_BYTES) {
    if (typeof maxBytes !== 'number' || Number.isNaN(maxBytes) || maxBytes < 1) {
      throw new RangeError('The "maxBytes" argument must be a positive number.');
    }
    this.#maxBytes = maxBytes;
  }

  /**
   * Appends a chunk and returns the dimensions once they are known.
   * @param {Uint8Array} chunk - The bytes received so far.
   * @returns {MediaProbeSize|null} The dimensions, or null when more data is needed.
   * @throws {TypeError} If `chunk` is not a Uint8Array.
   */
  push(chunk) {
    if (!(chunk instanceof Uint8Array)) {
      throw new TypeError('The "chunk" argument must be a Uint8Array.');
    }
    if (this.#resolved || this.#abandoned) {
      return null;
    }
    const merged = new Uint8Array(this.#buffer.length + chunk.length);
    merged.set(this.#buffer);
    merged.set(chunk, this.#buffer.length);
    this.#buffer = merged;
    if (!this.#format) {
      this.#format = this.#detect();
      if (!this.#format) {
        if (this.#buffer.length > 512) {
          this.#abandoned = true;
        }
        return null;
      }
    }
    try {
      const size = this.#format.parse(new TinyBufferReader(this.#buffer));
      if (size) {
        this.#resolved = true;
        this.#buffer = new Uint8Array(0);
        return size;
      }
    } catch (error) {
      if (!(error instanceof TinyNeedMoreData)) {
        throw error;
      }
    }
    if (this.#buffer.length > this.#maxBytes) {
      this.#abandoned = true;
      this.#buffer = new Uint8Array(0);
    }
    return null;
  }

  /**
   * Releases the buffered header.
   * @returns {void}
   */
  close() {
    this.#buffer = new Uint8Array(0);
    this.#abandoned = true;
  }

  /**
   * @returns {MediaFormat|null} The detected format, or null when more data is needed.
   */
  #detect() {
    for (const format of FORMATS) {
      if (format.sniff(this.#buffer)) {
        return format;
      }
    }
    return null;
  }
}

export default TinyMediaProbe;
