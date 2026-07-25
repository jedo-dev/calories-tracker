import sanitizeHtml from 'sanitize-html';

// Description comes from the TipTap editor as HTML. Only markup the editor can
// produce is allowed; img sources are restricted to our own S3 bucket.
export function sanitizeDescription(html: string, allowedImagePrefix: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 's', 'u', 'br', 'img', 'a', 'blockquote'],
    allowedAttributes: {
      img: ['src', 'alt'],
      a: ['href', 'rel', 'target'],
    },
    allowedSchemes: ['http', 'https'],
    disallowedTagsMode: 'discard',
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !(frame.attribs.src || '').startsWith(allowedImagePrefix),
  });
}
