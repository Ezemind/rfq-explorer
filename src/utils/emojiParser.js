// WhatsApp Emoji Parser and Renderer
// Supports Unicode emojis, WhatsApp emoji codes, and emoji rendering

// Common WhatsApp emoji mappings
const whatsappEmojiMap = {
  // Smileys & People
  ':-)': '😊',
  ':)': '😊',
  ':-D': '😃',
  ':D': '😃',
  ':-P': '😛',
  ':P': '😛',
  ':-p': '😛',
  ':p': '😛',
  ';-)': '😉',
  ';)': '😉',
  ':-(': '😢',
  ':(': '😢',
  ':-o': '😮',
  ':o': '😮',
  ':-O': '😮',
  ':O': '😮',
  ':-|': '😐',
  ':|': '😐',
  ':-/': '😕',
  ':/': '😕',
  ':-\\': '😕',
  ':\\': '😕',
  ':-*': '😘',
  ':*': '😘',
  '<3': '❤️',
  '</3': '💔',
  ':heart:': '❤️',
  ':broken_heart:': '💔',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':ok_hand:': '👌',
  ':clap:': '👏',
  ':pray:': '🙏',
  ':muscle:': '💪',
  ':wave:': '👋',
  ':point_right:': '👉',
  ':point_left:': '👈',
  ':point_up:': '👆',
  ':point_down:': '👇',
  ':raised_hand:': '✋',
  ':v:': '✌️',
  ':fist:': '✊',
  
  // Nature & Animals
  ':dog:': '🐶',
  ':cat:': '🐱',
  ':mouse:': '🐭',
  ':rabbit:': '🐰',
  ':fox:': '🦊',
  ':bear:': '🐻',
  ':panda:': '🐼',
  ':koala:': '🐨',
  ':tiger:': '🐯',
  ':lion:': '🦁',
  ':cow:': '🐮',
  ':pig:': '🐷',
  ':frog:': '🐸',
  ':monkey:': '🐵',
  ':chicken:': '🐔',
  ':penguin:': '🐧',
  ':bird:': '🐦',
  ':snake:': '🐍',
  ':turtle:': '🐢',
  ':fish:': '🐟',
  ':whale:': '🐳',
  ':dolphin:': '🐬',
  ':shark:': '🦈',
  ':octopus:': '🐙',
  ':butterfly:': '🦋',
  ':bug:': '🐛',
  ':bee:': '🐝',
  ':ant:': '🐜',
  ':spider:': '🕷️',
  ':scorpion:': '🦂',
  ':crab:': '🦀',
  ':lobster:': '🦞',
  ':shrimp:': '🦐',
  
  // Food & Drink
  ':apple:': '🍎',
  ':orange:': '🍊',
  ':lemon:': '🍋',
  ':banana:': '🍌',
  ':watermelon:': '🍉',
  ':grapes:': '🍇',
  ':strawberry:': '🍓',
  ':melon:': '🍈',
  ':cherry:': '🍒',
  ':peach:': '🍑',
  ':pineapple:': '🍍',
  ':tomato:': '🍅',
  ':eggplant:': '🍆',
  ':corn:': '🌽',
  ':hot_pepper:': '🌶️',
  ':cucumber:': '🥒',
  ':carrot:': '🥕',
  ':potato:': '🥔',
  ':sweet_potato:': '🍠',
  ':avocado:': '🥑',
  ':broccoli:': '🥦',
  ':lettuce:': '🥬',
  ':pizza:': '🍕',
  ':hamburger:': '🍔',
  ':fries:': '🍟',
  ':hotdog:': '🌭',
  ':sandwich:': '🥪',
  ':taco:': '🌮',
  ':burrito:': '🌯',
  ':coffee:': '☕',
  ':tea:': '🍵',
  ':beer:': '🍺',
  ':wine:': '🍷',
  ':cocktail:': '🍹',
  ':cake:': '🍰',
  ':cookie:': '🍪',
  ':chocolate:': '🍫',
  ':candy:': '🍬',
  ':ice_cream:': '🍦',
  ':donut:': '🍩',
  
  // Activities & Sports
  ':soccer:': '⚽',
  ':basketball:': '🏀',
  ':football:': '🏈',
  ':baseball:': '⚾',
  ':tennis:': '🎾',
  ':volleyball:': '🏐',
  ':rugby:': '🏉',
  ':golf:': '⛳',
  ':ping_pong:': '🏓',
  ':badminton:': '🏸',
  ':hockey:': '🏒',
  ':field_hockey:': '🏑',
  ':cricket:': '🏏',
  ':ski:': '🎿',
  ':snowboard:': '🏂',
  ':ice_skate:': '⛸️',
  ':bow_arrow:': '🏹',
  ':fishing:': '🎣',
  ':boxing:': '🥊',
  ':martial_arts:': '🥋',
  ':running:': '🏃',
  ':walking:': '🚶',
  ':dancing:': '💃',
  ':yoga:': '🧘',
  
  // Travel & Places
  ':car:': '🚗',
  ':taxi:': '🚕',
  ':bus:': '🚌',
  ':train:': '🚆',
  ':airplane:': '✈️',
  ':rocket:': '🚀',
  ':ship:': '🚢',
  ':boat:': '⛵',
  ':bicycle:': '🚲',
  ':motorcycle:': '🏍️',
  ':house:': '🏠',
  ':building:': '🏢',
  ':hotel:': '🏨',
  ':school:': '🏫',
  ':hospital:': '🏥',
  ':bank:': '🏦',
  ':church:': '⛪',
  ':mosque:': '🕌',
  ':temple:': '🛕',
  ':mountain:': '⛰️',
  ':beach:': '🏖️',
  ':desert:': '🏜️',
  ':island:': '🏝️',
  ':park:': '🏞️',
  ':camping:': '🏕️',
  
  // Objects & Symbols
  ':phone:': '📱',
  ':computer:': '💻',
  ':keyboard:': '⌨️',
  ':mouse_computer:': '🖱️',
  ':printer:': '🖨️',
  ':camera:': '📷',
  ':video_camera:': '📹',
  ':tv:': '📺',
  ':radio:': '📻',
  ':microphone:': '🎤',
  ':headphones:': '🎧',
  ':speaker:': '🔊',
  ':battery:': '🔋',
  ':electric_plug:': '🔌',
  ':bulb:': '💡',
  ':flashlight:': '🔦',
  ':candle:': '🕯️',
  ':fire:': '🔥',
  ':water:': '💧',
  ':snowflake:': '❄️',
  ':star:': '⭐',
  ':sun:': '☀️',
  ':moon:': '🌙',
  ':cloud:': '☁️',
  ':thunder:': '⚡',
  ':rainbow:': '🌈',
  ':umbrella:': '☔',
  ':gift:': '🎁',
  ':birthday:': '🎂',
  ':party:': '🎉',
  ':balloon:': '🎈',
  ':confetti:': '🎊',
  ':music:': '🎵',
  ':note:': '🎶',
  ':bell:': '🔔',
  ':no_bell:': '🔕',
  ':megaphone:': '📢',
  ':loudspeaker:': '📣',
  ':key:': '🔑',
  ':lock:': '🔒',
  ':unlock:': '🔓',
  ':hammer:': '🔨',
  ':wrench:': '🔧',
  ':gear:': '⚙️',
  ':bomb:': '💣',
  ':gun:': '🔫',
  ':knife:': '🔪',
  ':shield:': '🛡️',
  ':cigarette:': '🚬',
  ':pill:': '💊',
  ':syringe:': '💉',
  ':thermometer:': '🌡️',
  ':toilet:': '🚽',
  ':shower:': '🚿',
  ':bathtub:': '🛁',
  ':soap:': '🧼',
  ':toothbrush:': '🪥',
  ':sponge:': '🧽',
  ':bucket:': '🪣',
  ':broom:': '🧹',
  ':vacuum:': '🧹',
  
  // Flags (common ones)
  ':flag_us:': '🇺🇸',
  ':flag_uk:': '🇬🇧',
  ':flag_ca:': '🇨🇦',
  ':flag_au:': '🇦🇺',
  ':flag_de:': '🇩🇪',
  ':flag_fr:': '🇫🇷',
  ':flag_es:': '🇪🇸',
  ':flag_it:': '🇮🇹',
  ':flag_jp:': '🇯🇵',
  ':flag_kr:': '🇰🇷',
  ':flag_cn:': '🇨🇳',
  ':flag_in:': '🇮🇳',
  ':flag_br:': '🇧🇷',
  ':flag_za:': '🇿🇦',
  
  // Miscellaneous
  ':100:': '💯',
  ':question:': '❓',
  ':exclamation:': '❗',
  ':warning:': '⚠️',
  ':no_entry:': '⛔',
  ':stop_sign:': '🛑',
  ':recycle:': '♻️',
  ':check:': '✅',
  ':x:': '❌',
  ':o:': '⭕',
  ':white_check_mark:': '✅',
  ':heavy_check_mark:': '✔️',
  ':cross_mark:': '❌',
  ':copyright:': '©️',
  ':registered:': '®️',
  ':tm:': '™️'
};

// Unicode emoji regex to detect existing emojis
const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]/gu;

/**
 * Parse and convert WhatsApp emoji codes and emoticons to Unicode emojis
 * @param {string} text - The input text containing emoji codes
 * @returns {string} - Text with emoji codes converted to Unicode emojis
 */
export function parseEmojis(text) {
  if (!text || typeof text !== 'string') return text;
  
  let processedText = text;
  
  // Replace WhatsApp emoji codes with Unicode emojis
  Object.entries(whatsappEmojiMap).forEach(([code, emoji]) => {
    // Escape special regex characters
    const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedCode, 'g');
    processedText = processedText.replace(regex, emoji);
  });
  
  return processedText;
}

/**
 * Check if text contains emojis (Unicode emojis)
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains emojis
 */
export function hasEmojis(text) {
  if (!text || typeof text !== 'string') return false;
  return emojiRegex.test(text);
}

/**
 * Extract all emojis from text
 * @param {string} text - The text to extract emojis from
 * @returns {string[]} - Array of emoji characters found
 */
export function extractEmojis(text) {
  if (!text || typeof text !== 'string') return [];
  return text.match(emojiRegex) || [];
}

/**
 * Count emojis in text
 * @param {string} text - The text to count emojis in
 * @returns {number} - Number of emojis found
 */
export function countEmojis(text) {
  return extractEmojis(text).length;
}

/**
 * Remove all emojis from text
 * @param {string} text - The text to remove emojis from
 * @returns {string} - Text without emojis
 */
export function removeEmojis(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(emojiRegex, '');
}

/**
 * Check if text is emoji-only (contains only emojis and whitespace)
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains only emojis and whitespace
 */
export function isEmojiOnly(text) {
  if (!text || typeof text !== 'string') return false;
  const textWithoutEmojis = removeEmojis(text);
  return textWithoutEmojis.trim().length === 0 && hasEmojis(text);
}

/**
 * Get emoji-specific CSS classes for styling
 * @param {string} text - The text to analyze
 * @returns {string} - CSS classes for emoji styling
 */
export function getEmojiClasses(text) {
  if (!hasEmojis(text)) return '';
  
  const emojiCount = countEmojis(text);
  const isOnlyEmojis = isEmojiOnly(text);
  
  if (isOnlyEmojis) {
    if (emojiCount === 1) return 'text-4xl'; // Single emoji - large
    if (emojiCount <= 3) return 'text-3xl'; // Few emojis - medium-large
    if (emojiCount <= 6) return 'text-2xl'; // Some emojis - medium
    return 'text-xl'; // Many emojis - normal large
  }
  
  return ''; // Mixed text and emojis - normal size
}

/**
 * Comprehensive emoji parsing and formatting for WhatsApp-style messages
 * @param {string} text - The input text
 * @returns {object} - Object with processed text and styling info
 */
export function processMessageText(text) {
  if (!text || typeof text !== 'string') {
    return {
      text: text || '',
      hasEmojis: false,
      isEmojiOnly: false,
      emojiCount: 0,
      classes: ''
    };
  }
  
  // First parse emoji codes to Unicode emojis
  const parsedText = parseEmojis(text);
  
  // Analyze the processed text
  const hasEmojisResult = hasEmojis(parsedText);
  const emojiCount = countEmojis(parsedText);
  const isEmojiOnlyResult = isEmojiOnly(parsedText);
  const classes = getEmojiClasses(parsedText);
  
  return {
    text: parsedText,
    hasEmojis: hasEmojisResult,
    isEmojiOnly: isEmojiOnlyResult,
    emojiCount,
    classes
  };
}