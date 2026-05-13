import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List } from 'lucide-react';
import { cn } from '../lib/utils';

interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

export function RichTextEditor({ name, defaultValue = '', placeholder, required }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [htmlValue, setHtmlValue] = useState('');

  // Handle initialization
  useEffect(() => {
    if (editorRef.current && defaultValue && !editorRef.current.innerHTML) {
      // Basic normalizer to convert \n to <br> for older plaintext entries
      let initialValue = defaultValue;
      if (defaultValue.includes('<b>') || defaultValue.includes('<ul>') || defaultValue.includes('<br>')) {
        initialValue = defaultValue;
      } else {
        initialValue = defaultValue.replace(/\n/g, '<br/>');
      }
      
      editorRef.current.innerHTML = initialValue;
      setHtmlValue(initialValue);
    }
  }, [defaultValue]);

  const handleInput = () => {
    if (editorRef.current) {
      let val = editorRef.current.innerHTML;
      if (val === '<br>') val = '';
      setHtmlValue(val);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className={cn(
      "border rounded-xl bg-gray-50 transition-colors focus-within:bg-white overflow-hidden",
      isFocused ? "border-pami-cyan ring-1 ring-pami-cyan" : "border-gray-200"
    )}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
          className="p-1.5 text-gray-500 hover:text-pami-blue hover:bg-gray-100 rounded-md transition-colors w-8 h-8 flex items-center justify-center"
          title="Negrita"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
          className="p-1.5 text-gray-500 hover:text-pami-blue hover:bg-gray-100 rounded-md transition-colors w-8 h-8 flex items-center justify-center"
          title="Cursiva"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }}
          className="p-1.5 text-gray-500 hover:text-pami-blue hover:bg-gray-100 rounded-md transition-colors w-8 h-8 flex items-center justify-center"
          title="Subrayado"
        >
          <Underline size={16} />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
          className="p-1.5 text-gray-500 hover:text-pami-blue hover:bg-gray-100 rounded-md transition-colors w-8 h-8 flex items-center justify-center"
          title="Lista de items"
        >
          <List size={16} />
        </button>
      </div>
      
      {/* Hidden input to pass value in form.get('name') */}
      <input type="hidden" name={name} value={htmlValue} required={required} readOnly />

      {/* Editor */}
      <div
        ref={editorRef}
        className={cn(
          "p-3 min-h-[120px] max-h-[300px] overflow-y-auto focus:outline-none text-sm text-gray-700",
          "rich-text-content max-w-none"
        )}
        contentEditable
        onInput={handleInput}
        onKeyUp={handleInput}
        onBlur={() => { setIsFocused(false); handleInput(); }}
        onFocus={() => setIsFocused(true)}
        data-placeholder={placeholder}
        style={{
          wordBreak: 'break-word',
          outline: 'none'
        }}
      />
    </div>
  );
}
