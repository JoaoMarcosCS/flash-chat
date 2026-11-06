import emojiRegex from 'emoji-regex';

const EMOJI_REGEX = emojiRegex();

export function hasEmoji(value: string): boolean {
  EMOJI_REGEX.lastIndex = 0;
  return EMOJI_REGEX.test(value);
}
