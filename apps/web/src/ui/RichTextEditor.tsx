import { useRef, useState } from 'react';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  placeholder?: string;
}

// TipTap output for an empty document
export const EMPTY_RICH_TEXT = '<p></p>';

export function isRichTextEmpty(html: string | undefined | null): boolean {
  return !html || html === EMPTY_RICH_TEXT;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  const theme = useTheme();
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '12px',
        border: `1px solid ${active ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
        background: active ? theme.palette.primary + '26' : 'rgba(255,255,255,0.06)',
        color: active ? theme.palette.primary : theme.palette.text,
        fontSize: '14px',
        fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onPickImage,
  uploading,
}: {
  editor: Editor;
  onPickImage: () => void;
  uploading: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
      <ToolbarButton
        title={t('recipeEditor.bold')}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        title={t('recipeEditor.italic')}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span style={{ fontStyle: 'italic', fontFamily: 'serif' }}>I</span>
      </ToolbarButton>
      <ToolbarButton
        title={t('recipeEditor.heading')}
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title={t('recipeEditor.heading')}
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        title={t('recipeEditor.list')}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        ••
      </ToolbarButton>
      <ToolbarButton
        title={t('recipeEditor.numberedList')}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton title={t('recipeEditor.insertImage')} disabled={uploading} onClick={onPickImage}>
        {uploading ? '…' : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({ value, onChange, onUploadImage, placeholder }: RichTextEditorProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image,
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    if (file.size > MAX_IMAGE_SIZE) {
      alert(t('recipeEditor.imageTooLarge'));
      return;
    }
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error('Image upload failed', err);
      alert(t('recipeEditor.imageUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="rte-root">
      <style>{`
        .rte-root .rte-content {
          border: 1px solid ${theme.palette.border};
          border-radius: 14px;
          background: rgba(3, 18, 28, 0.5);
          padding: 12px;
          min-height: 140px;
        }
        .rte-root .ProseMirror {
          outline: none;
          min-height: 116px;
          color: ${theme.palette.text};
          font-size: 15px;
          line-height: 1.5;
        }
        .rte-root .ProseMirror p { margin: 0 0 8px; }
        .rte-root .ProseMirror h2 { font-size: 19px; margin: 12px 0 8px; }
        .rte-root .ProseMirror h3 { font-size: 16px; margin: 10px 0 6px; }
        .rte-root .ProseMirror ul, .rte-root .ProseMirror ol { padding-left: 22px; margin: 0 0 8px; }
        .rte-root .ProseMirror img {
          max-width: 100%;
          border-radius: 12px;
          display: block;
          margin: 8px 0;
        }
        .rte-root .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid ${theme.palette.primary};
        }
        .rte-root .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: ${theme.palette.textMuted};
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
      <Toolbar editor={editor} uploading={uploading} onPickImage={() => fileInputRef.current?.click()} />
      <div className="rte-content" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}
