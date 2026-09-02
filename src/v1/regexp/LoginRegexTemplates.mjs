/**
 * Represents the type for transformations applied to extracted usernames.
 * @typedef {import('./Login.mjs').UsernameTransform} UsernameTransform
 */

/**
 * Configuration options for constructing username regular expressions.
 * @typedef {Object} UsernameRegexOptions
 * @property {string} validValues The allowed characters for the username part.
 * @property {[number, number]} [length] The [min, max] length of the username part.
 * @property {string} prefix An prefix like '@' or '#'.
 * @property {string} [domainPattern] A regex pattern for a domain.
 * @property {string} [domain] A literal domain string (e.g., '@matrix.org'). Will be escaped automatically.
 * @property {UsernameTransform} [transform=null] Optional transformation applied to the extracted usernames.
 */

/**
 * Matrix Protocol (matrix.org)
 */
export const matrixProtocol = Object.freeze({
  /** @type {UsernameRegexOptions} */
  userName: {
    prefix: '@',
    validValues: '[a-z0-9._=-]',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
  /** @type {UsernameRegexOptions} */
  roomName: {
    prefix: '#',
    validValues: '[a-zA-Z0-9._=-]',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
});

/**
 * Bluesky / AT Protocol
 */
export const blueSkyProtocol = Object.freeze({
  /** @type {UsernameRegexOptions} */
  handle: {
    prefix: '@',
    validValues: '[a-zA-Z0-9-]',
    length: [1, 63],
    domainPattern: '(?:\\.[a-zA-Z0-9-]+)+',
  },
});

/**
 * Discord Protocol
 */
export const discordProtocol = Object.freeze({
  /**
   * Modern Discord Usernames (Handles)
   * Formato: @username
   * @type {UsernameRegexOptions}
   */
  userName: {
    prefix: '@',
    validValues: '[a-z0-9_.]',
    length: [2, 32],
  },
  /**
   * Código de Menção de Usuário Padrão
   * Formato: <@USER_ID>
   * @type {UsernameRegexOptions}
   */
  userMention: {
    prefix: '<@',
    validValues: '[0-9]',
    length: [17, 22],
    domain: '>',
  },
  /**
   * Código de Menção de Usuário (Apelido/Nickname no Servidor)
   * Formato: <@!USER_ID>
   * @type {UsernameRegexOptions}
   */
  nicknameMention: {
    prefix: '<@!',
    validValues: '[0-9]',
    length: [17, 22],
    domain: '>',
  },
  /**
   * Código de Menção de Cargo (Role)
   * Formato: <@&ROLE_ID>
   * @type {UsernameRegexOptions}
   */
  roleMention: {
    prefix: '<@&',
    validValues: '[0-9]',
    length: [17, 22],
    domain: '>',
  },
  /**
   * Código de Menção de Canal (Cobre todos os tipos: Texto, Voz, Fórum, Palco, etc.)
   * Formato: <#CHANNEL_ID>
   * @type {UsernameRegexOptions}
   */
  channelMention: {
    prefix: '<#',
    validValues: '[0-9]',
    length: [17, 22],
    domain: '>',
  },
  /**
   * Código de Emoji Personalizado Padrão
   * Formato: <:name:ID>
   * @type {UsernameRegexOptions}
   */
  customEmoji: {
    prefix: '<:',
    validValues: '[a-zA-Z0-9_]',
    length: [2, 32],
    domainPattern: ':[0-9]{17,22}>',
  },
  /**
   * Código de Emoji Personalizado Animado
   * Formato: <a:name:ID>
   * @type {UsernameRegexOptions}
   */
  animatedEmoji: {
    prefix: '<a:',
    validValues: '[a-zA-Z0-9_]',
    length: [2, 32],
    domainPattern: ':[0-9]{17,22}>',
  },
  /**
   * Código de Menção de Comandos de Barra (Slash Commands)
   * Formato: </name:ID> ou </name subcommand:ID>
   * @type {UsernameRegexOptions}
   */
  slashCommand: {
    prefix: '</',
    validValues: '[a-zA-Z0-9_ -]',
    length: [1, 100],
    domainPattern: ':[0-9]{17,22}>',
  },
});
