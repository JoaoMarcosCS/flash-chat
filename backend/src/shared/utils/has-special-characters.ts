import emojiRegex from 'emoji-regex';


const EMOJI_REGEX = emojiRegex();
// Cobre emojis de um único code point (😀), sequências ZWJ (👨‍👩‍👧‍👦),
// bandeiras regionais (🇧🇷) e keycaps (1️⃣) — casos que \p{Extended_Pictographic} não detecta.
// Retorna true se a string contiver qualquer emoji.
export const hasEmoji = (value: string): boolean => {
  EMOJI_REGEX.lastIndex = 0;
  return EMOJI_REGEX.test(value);
};
