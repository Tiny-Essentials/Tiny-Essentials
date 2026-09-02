import { ipv4Regex, isValidIPv4, findIPv4Regex, extractIPsV4 } from './Ipv4.mjs';
import { extractIPsV6, findIPv6Regex, ipv6Regex, isValidIPv6 } from './Ipv6.mjs';
import { makeSegmentExtractor, segmentExtractorV1 } from './SegmentExtractor.mjs';

export {
  makeSegmentExtractor,
  segmentExtractorV1,
  ipv4Regex,
  isValidIPv4,
  findIPv4Regex,
  extractIPsV4,
  ipv6Regex,
  isValidIPv6,
  findIPv6Regex,
  extractIPsV6,
};
