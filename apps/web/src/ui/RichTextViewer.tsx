import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { useTheme } from '../theme/useTheme';

interface RichTextViewerProps {
  html: string;
}

// Defense in depth: the backend already sanitizes descriptions, this guards
// against anything that slipped into the DB before that.
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 's', 'u', 'br', 'img', 'a', 'blockquote'],
  ALLOWED_ATTR: ['src', 'alt', 'href', 'rel', 'target'],
};

export function RichTextViewer({ html }: RichTextViewerProps) {
  const theme = useTheme();
  const clean = useMemo(() => DOMPurify.sanitize(html, SANITIZE_OPTIONS), [html]);

  return (
    <div className="rtv-root">
      <style>{`
        .rtv-root {
          color: ${theme.palette.text};
          font-size: 15px;
          line-height: 1.55;
          overflow-wrap: break-word;
        }
        .rtv-root p { margin: 0 0 8px; }
        .rtv-root p:last-child { margin-bottom: 0; }
        .rtv-root h2 { font-size: 19px; margin: 12px 0 8px; }
        .rtv-root h3 { font-size: 16px; margin: 10px 0 6px; }
        .rtv-root ul, .rtv-root ol { padding-left: 22px; margin: 0 0 8px; }
        .rtv-root img {
          max-width: 100%;
          border-radius: 14px;
          display: block;
          margin: 10px 0;
        }
        .rtv-root a { color: ${theme.palette.primary}; }
        .rtv-root blockquote {
          margin: 8px 0;
          padding-left: 12px;
          border-left: 3px solid ${theme.palette.primary};
          color: ${theme.palette.textMuted};
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: clean }} />
    </div>
  );
}
