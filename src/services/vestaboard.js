const config = require('../config');

// Vestaboard character code mapping
// See: https://docs.vestaboard.com/docs/characterCodes
const CHAR_CODES = {
  ' ': 0,
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
  'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17,
  'R': 18, 'S': 19, 'T': 20, 'U': 21, 'V': 22, 'W': 23, 'X': 24, 'Y': 25, 'Z': 26,
  '1': 27, '2': 28, '3': 29, '4': 30, '5': 31, '6': 32, '7': 33, '8': 34, '9': 35, '0': 36,
  '!': 37, '@': 38, '#': 39, '$': 40, '(': 41, ')': 42,
  '-': 44, '+': 46, '&': 47, '=': 48, ';': 49, ':': 50,
  "'": 52, '"': 53, '%': 54, ',': 55, '.': 56,
  '/': 59, '?': 60, '°': 62
};

function textToCharacterCodes(text) {
  const lines = text.split('\n');
  const board = [];

  for (let row = 0; row < 6; row++) {
    const line = lines[row] || '';
    const rowCodes = [];

    for (let col = 0; col < 22; col++) {
      const char = (line[col] || ' ').toUpperCase();
      const code = CHAR_CODES[char];
      rowCodes.push(code !== undefined ? code : 0);
    }

    board.push(rowCodes);
  }

  return board;
}

async function postToVestaboard(text) {
  const { apiKey, apiSecret, subscriptionId } = config.vestaboard;

  if (!apiKey || !apiSecret || !subscriptionId) {
    throw new Error('Vestaboard API key, secret, or subscription ID not configured');
  }

  const characterCodes = textToCharacterCodes(text);

  // Using the Subscriptions API
  const response = await fetch(`https://subscriptions.vestaboard.com/subscriptions/${subscriptionId}/message`, {
    method: 'POST',
    headers: {
      'X-Vestaboard-Api-Key': apiKey,
      'X-Vestaboard-Api-Secret': apiSecret,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ characters: characterCodes })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vestaboard API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

module.exports = {
  postToVestaboard,
  textToCharacterCodes
};
