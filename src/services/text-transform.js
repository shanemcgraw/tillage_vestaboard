// Vestaboard character set: A-Z, 0-9, and limited punctuation
// Board dimensions: 6 rows x 22 columns = 132 characters max

const VESTABOARD_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$()+-&=;:\'"%,./?° ';

const CHAR_REPLACEMENTS = {
  // Smart quotes to straight quotes
  '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
  // Dashes
  '\u2013': '-', '\u2014': '-', '\u2212': '-',
  // Ellipsis
  '\u2026': '...',
  // Spaces
  '\u00A0': ' ', '\t': ' ',
  // Common symbols
  '\u00B0': '°', // degree
  '\u0027': "'", // apostrophe
};

const ROWS = 6;
const COLS = 22;

function normalizeText(text) {
  if (!text) return '';

  let result = text;

  // Apply character replacements
  for (const [from, to] of Object.entries(CHAR_REPLACEMENTS)) {
    result = result.split(from).join(to);
  }

  // Convert to uppercase
  result = result.toUpperCase();

  // Replace newlines with spaces for wrapping
  result = result.replace(/\r?\n/g, ' ');

  // Collapse multiple spaces
  result = result.replace(/\s+/g, ' ').trim();

  // Remove unsupported characters
  result = result
    .split('')
    .filter(char => VESTABOARD_CHARS.includes(char))
    .join('');

  return result;
}

function wordWrap(text, width) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;

    // Word longer than line width - split it with hyphen
    if (word.length > width) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      // Split long word across lines with hyphenation
      let remaining = word;
      while (remaining.length > width) {
        // Leave room for hyphen at the end
        const breakPoint = width - 1;
        lines.push(remaining.slice(0, breakPoint) + '-');
        remaining = remaining.slice(breakPoint);
      }
      currentLine = remaining;
      continue;
    }

    // Check if word fits on current line
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= width) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function transformForVestaboard(text) {
  const normalized = normalizeText(text);
  let lines = wordWrap(normalized, COLS);

  // Truncate to max rows
  if (lines.length > ROWS) {
    lines = lines.slice(0, ROWS);
    // Add ellipsis to last line if truncated
    const lastLine = lines[ROWS - 1];
    if (lastLine.length > COLS - 3) {
      lines[ROWS - 1] = lastLine.slice(0, COLS - 3) + '...';
    } else {
      lines[ROWS - 1] = lastLine + '...';
    }
  }

  // Left-justify each line and pad to width
  const leftJustifiedLines = lines.map(line => {
    return line + ' '.repeat(COLS - line.length);
  });

  // Pad to 6 rows if needed
  while (leftJustifiedLines.length < ROWS) {
    leftJustifiedLines.push(' '.repeat(COLS));
  }

  return leftJustifiedLines.join('\n');
}

function formatPreview(vestaboardText) {
  // Return the 6x22 grid for display
  return vestaboardText;
}

module.exports = {
  normalizeText,
  wordWrap,
  transformForVestaboard,
  formatPreview,
  ROWS,
  COLS
};
