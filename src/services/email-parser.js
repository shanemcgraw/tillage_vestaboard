// Email parsing and cleaning utilities

// Common email signature patterns to strip
const SIGNATURE_PATTERNS = [
  /^--\s*$/m,                           // Standard sig delimiter
  /^_{3,}$/m,                           // Underscores
  /^-{3,}$/m,                           // Dashes
  /^Sent from my \w+/im,                // Mobile signatures
  /^Get Outlook for/im,
  /^Sent from Mail for/im,
  /^Sent from Yahoo Mail/im,
];

// Reply chain patterns
const REPLY_PATTERNS = [
  /^On .+ wrote:$/m,                    // "On [date], [person] wrote:"
  /^>.*$/gm,                            // Quoted lines
  /^From:.*$/m,                         // Email headers in replies
  /^Sent:.*$/m,
  /^To:.*$/m,
  /^Subject:.*$/m,
  /^Date:.*$/m,
  /-{2,}Original Message-{2,}/i,        // Outlook style
  /_{2,}$/m,
];

function cleanEmailBody(text) {
  if (!text) return '';

  let cleaned = text;

  // Remove reply chains first (they contain the most noise)
  for (const pattern of REPLY_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined) {
      // For "On ... wrote:" pattern, truncate everything after
      if (pattern.source.includes('wrote:')) {
        cleaned = cleaned.slice(0, match.index).trim();
      }
    }
  }

  // Remove quoted lines
  cleaned = cleaned
    .split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .join('\n');

  // Find and remove signature blocks
  for (const pattern of SIGNATURE_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined) {
      cleaned = cleaned.slice(0, match.index).trim();
    }
  }

  // Clean up whitespace
  cleaned = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}

function parseEmailAddress(fromField) {
  // Parse "Name <email@domain.com>" format
  if (!fromField) return { name: null, email: null };

  const match = fromField.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].replace(/^["']|["']$/g, '').trim(),
      email: match[2].trim().toLowerCase()
    };
  }

  // Just an email address
  return {
    name: null,
    email: fromField.trim().toLowerCase()
  };
}

function extractPlainText(text, html) {
  // Prefer plain text if available
  if (text && text.trim()) {
    return text;
  }

  // Basic HTML to text conversion
  if (html) {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  return '';
}

module.exports = {
  cleanEmailBody,
  parseEmailAddress,
  extractPlainText
};
