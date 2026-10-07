import TinyTextDiffer from '../../dist/v1/libs/text/TinyTextDiffer.mjs';
import TinyClassManager from '../../dist/v1/libs/tools/TinyClassManager.mjs';
import TinyHtmlTagRegexBuilder from '../../dist/v1/libs/tools/TinyHtmlTagRegexBuilder.mjs';
import TinyUriParser from '../../dist/v1/libs/tools/TinyUriParser.mjs';
import { DiscordProtocolParsers } from '../../dist/v1/libs/tools/TinyUriParser/Discord.mjs';
import {
  extractUsernames,
  usernameRegex,
  isValidUsername,
} from '../../dist/v1/regexp/Username/index.mjs';
import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based text/tools/regex test environments.
 *
 * Covers:
 * - TinyTextDiffer (`test/html/text/TinyTextDiffer`)
 * - TinyClassManager (`test/html/tools/TinyClassManager`)
 * - TinyHtmlTagRegexBuilder (`test/html/tools/TinyHtmlTagRegexBuilder`)
 * - TinyUriParser (`test/html/tools/TinyUriParser`)
 * - Username regexp (`test/html/regex/Username`)
 *
 * @returns {Promise<void>}
 */
const testTextTools = async () => {
  const t = new TestRunner('TinyTextDiffer');

  // ---------------------------------------------------------------------
  // TinyTextDiffer
  // ---------------------------------------------------------------------
  section('TinyTextDiffer - history', '📝');
  const differ = new TinyTextDiffer(['Hello World', 'Hellow World!']);
  t.equal(differ.size, 2, 'Initializes with the provided history');
  t.equal(differ.get(0), 'Hello World', 'get returns the value at an index');
  t.equal(differ.has(5), false, 'has returns false for missing indexes');

  differ.add('Hello World!!!');
  t.equal(differ.size, 3, 'add appends a new version');
  differ.addAt(0, 'Zero');
  t.equal(differ.get(0), 'Zero', 'addAt inserts at the given index');
  differ.removeAt(0);
  t.equal(differ.get(0), 'Hello World', 'removeAt removes the given index');

  section('TinyTextDiffer - diffing', '🔬');
  const diff = differ.compare(0, 1);
  t.ok(Array.isArray(diff) && Array.isArray(diff[0]), 'compare returns an array of diffs');
  t.ok(
    diff[0].every((part) => ['normal', 'added', 'deleted'].includes(part.type)),
    'Diff parts have a valid type',
  );

  differ.clear();
  t.equal(differ.size, 0, 'clear empties the history');

  // ---------------------------------------------------------------------
  // TinyClassManager
  // ---------------------------------------------------------------------
  const c = new TestRunner('TinyClassManager');
  section('TinyClassManager - composition', '🧩');
  class EntityCore {
    constructor(id) {
      this.id = id;
    }
  }

  const applyHealth = (Base) =>
    class HealthPlugin extends Base {
      static _tinyDepName = 'Health';
      static _tinyDeps = [];
      constructor(id) {
        super(id);
        this.hp = 100;
      }
      takeDamage(amount) {
        this.hp -= amount;
      }
    };

  const applyArmor = (Base) =>
    class ArmorPlugin extends Base {
      static _tinyDepName = 'Armor';
      static _tinyDeps = ['Health'];
      constructor(id) {
        super(id);
        this.armor = 50;
      }
      takeDamage(amount) {
        super.takeDamage(Math.max(0, amount - this.armor * 0.1));
      }
    };

  const FinalClass = new TinyClassManager(EntityCore)
    .insert(applyHealth)
    .insert(applyArmor)
    .build();
  const entity = new FinalClass('Hero_1');
  entity.takeDamage(30);
  c.equal(entity.id, 'Hero_1', 'Keeps the base class state');
  c.equal(entity.hp, 75, 'Applies plugin overrides in order');
  c.equal(entity.armor, 50, 'Applies every plugin');
  c.throws(
    () => new TinyClassManager(EntityCore).insert(applyArmor),
    'Throws when a dependency is missing',
  );

  // ---------------------------------------------------------------------
  // TinyHtmlTagRegexBuilder
  // ---------------------------------------------------------------------
  const h = new TestRunner('TinyHtmlTagRegexBuilder');
  section('TinyHtmlTagRegexBuilder', '🏷️');
  const builder = new TinyHtmlTagRegexBuilder({
    tagName: 'a',
    attributes: ['href'],
    captureAllAttributes: false,
  });
  h.ok(builder.toString().startsWith('<a'), 'toString builds a regex string');
  const matches = builder.parse('<a href="https://example.com">link</a>');
  h.equal(matches.length, 1, 'parse finds the tag');
  h.equal(matches[0].attributes.href, 'https://example.com', 'parse extracts attributes');
  h.equal(matches[0].child, 'link', 'parse extracts the inner content');
  h.throws(() => new TinyHtmlTagRegexBuilder({ tagName: 'a b' }), 'Rejects invalid tag names');

  // ---------------------------------------------------------------------
  // TinyUriParser
  // ---------------------------------------------------------------------
  const u = new TestRunner('TinyUriParser');
  section('TinyUriParser - Discord', '🔗');
  const parser = new TinyUriParser(...DiscordProtocolParsers);
  const parsed = parser.parse('<@123456789012345678>');
  u.equal(parsed.type, 'mention', 'Parses a Discord mention');
  u.equal(parsed.data.id, '123456789012345678', 'Extracts the mention id');
  u.equal(parser.stringify(parsed), '<@123456789012345678>', 'Round-trips the mention');
  u.throws(() => parser.parse('not a uri at all'), 'Throws for unknown protocols');
  parser.destroy();

  // ---------------------------------------------------------------------
  // Username regexp
  // ---------------------------------------------------------------------
  const r = new TestRunner('Username regexp');
  section('Username regexp', '🔤');
  const options = { validValues: '[a-z]', length: [2, 10] };
  r.ok(usernameRegex(options) instanceof RegExp, 'usernameRegex returns a RegExp');
  r.equal(isValidUsername('alice', options), true, 'isValidUsername accepts valid input');
  r.equal(isValidUsername('A', options), false, 'isValidUsername rejects invalid input');
  r.deepEqual(
    extractUsernames('hi @alice and @bob', options),
    ['hi', 'alice', 'and', 'bob'],
    'extractUsernames extracts every match',
  );

  console.log(`\n${color('gray', 'Text/Tools test-suite finished.')}`);

  return t.summary() + c.summary() + h.summary() + u.summary() + r.summary();
};

export default testTextTools;
