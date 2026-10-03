/**
 * Utilities for generating dynamic, rich share templates for WhatsApp and Instagram.
 */

/**
 * Strips markdown and HTML formatting, returning a clean excerpt.
 */
export function cleanExcerpt(text = '', maxLength = 220) {
  if (!text) return '';

  const cleaned = text
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // unwrap links
    .replace(/#{1,6}\s+/g, '') // remove headers
    .replace(/[*_~`]/g, '') // remove bold/italic/code markers
    .replace(/>\s+/g, '') // remove blockquotes
    .replace(/[-*+]\s+/g, '• ') // standardize bullet points
    .replace(/\s+/g, ' ') // collapse whitespaces
    .trim();

  if (cleaned.length <= maxLength) return cleaned;

  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

/**
 * Formats a date nicely for social sharing.
 */
export function formatShareDate(dateValue) {
  if (!dateValue) return null;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

/**
 * Builds a rich WhatsApp share template with bold/italic formatting,
 * dividers, emojis, and a clear call to action.
 */
export function buildWhatsAppTemplate({
  type = 'announcement',
  title = '',
  description = '',
  date = null,
  venue = null,
  audience = null,
  price = null,
  author = null,
  url = typeof window !== 'undefined' ? window.location.href : '',
}) {
  const summary = cleanExcerpt(description, 200);
  const formattedDate = formatShareDate(date);

  let label = 'Campus Announcement';
  let cta = '👉 View details:';
  let footer = '— Skyline Student Association • LDCE';

  if (type === 'event') {
    label = 'Campus Event';
    cta = '👉 Book passes & view schedule:';
  } else if (type === 'merch' || type === 'product') {
    label = 'Campus Merch Drop';
    cta = '👉 Reserve yours:';
    footer = '— Skyline Campus Store • LDCE';
  }

  const lines = [
    `*${label}*`,
    `*${title.trim()}*`,
  ];

  if (formattedDate) lines.push(`🗓️ ${formattedDate}`);
  if (venue) lines.push(`📍 ${venue}`);
  if (audience) {
    const audLabel = audience === 'MEMBERS' ? 'Members Only' : 'Open to All Students';
    lines.push(`👥 ${audLabel}`);
  }
  if (price !== null && price !== undefined) lines.push(`🎟️ ${price}`);
  if (author) lines.push(`✍️ ${author}`);

  if (summary) {
    lines.push('');
    lines.push(summary);
  }

  lines.push('');
  lines.push(cta);
  lines.push(url);
  lines.push('');
  lines.push(footer);

  const fullText = lines.join('\n');
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;

  return { text: fullText, shareUrl };
}

/**
 * Builds Instagram-ready templates:
 * 1. Story / Reel Link Sticker text
 * 2. Feed Post caption with hashtags
 */
export function buildInstagramTemplate({
  type = 'announcement',
  title = '',
  description = '',
  date = null,
  venue = null,
  audience = null,
  price = null,
  url = typeof window !== 'undefined' ? window.location.href : '',
}) {
  const summary = cleanExcerpt(description, 260);
  const formattedDate = formatShareDate(date);

  // Common tags tailored to LDCE and campus student culture
  const hashtags = [
    '#LDCE',
    '#NirmaUniversity',
    '#SkylinePortal',
    '#CampusBuzz',
    '#AhmedabadStudents',
    '#CollegeLife',
    type === 'event' ? '#CampusEvents' : type === 'merch' ? '#CollegeMerch' : '#CampusUpdates',
    '#GTU',
  ].join(' ');

  // 1. Story Template
  const storyLines = [
    type === 'event' ? '✨ NEW EVENT ALERT ✨' : type === 'merch' ? '🛍️ NEW MERCH DROP 🛍️' : '🚨 CAMPUS ANNOUNCEMENT 🚨',
    '',
    title.trim(),
    '',
  ];

  if (formattedDate) storyLines.push(`🗓️ ${formattedDate}`);
  if (venue) storyLines.push(`📍 ${venue}`);
  if (price) storyLines.push(`🎟️ ${price}`);

  if (summary) {
    storyLines.push('');
    storyLines.push(`"${summary}"`);
  }

  storyLines.push('');
  storyLines.push('🔗 Tap Link Sticker below or check bio:');
  storyLines.push(url);
  storyLines.push('');
  storyLines.push(hashtags);

  // 2. Feed Post Caption Template
  const feedLines = [
    `📢 ${title.trim()}`,
    '',
    summary || 'Stay updated with the latest campus activities and notices.',
    '',
  ];

  if (formattedDate) feedLines.push(`🗓️ Date: ${formattedDate}`);
  if (venue) feedLines.push(`📍 Venue: ${venue}`);
  if (audience) {
    const audLabel = audience === 'MEMBERS' ? 'Club Members Only' : 'Open to All Students';
    feedLines.push(`👥 Audience: ${audLabel}`);
  }
  if (price) feedLines.push(`🎟️ Entry: ${price}`);

  feedLines.push('');
  feedLines.push('🔗 Link in bio to access the full portal post & registered passes!');
  feedLines.push('📌 Save this post & share with your classmates 👥');
  feedLines.push('');
  feedLines.push('.');
  feedLines.push('.');
  feedLines.push(hashtags);

  return {
    storyText: storyLines.join('\n'),
    feedText: feedLines.join('\n'),
    url,
  };
}
