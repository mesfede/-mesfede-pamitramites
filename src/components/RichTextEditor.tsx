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
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && defaultValue && !editorRef.current.innerHTML) {
      // Basic normalizer to convert \n to <br> for older plaintext entries
      const normalizedValue = defaultValue.includes('<') && defaultValue.includes('>') 
        ? defaultValue 
        : defaultValue.replace(/\ng/g, '<br/>');
        // Actually simpler:
      editorRef.current.innerHTML = defaultValue.replace(/\n/g, '<br/>');
      // Wait, if it already has html tags, doing replace \n could add extra breaks. Let's do:
      if (defaultValue.includes('<b>') || defaultValue.includes('<ul>') || defaultValue.includes('<br>')) {
        editorRef.current.innerHTML = defaultValue;
      } else {
        editorRef.current.innerHTML = defaultValue.replace(/\n/g, '<br/>');
      }
      
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = editorRef.current.innerHTML;
      }
    }
  }, [defaultValue]);

  const handleInput = () => {
    if (hiddenInputRef.current && editorRef.current) {
      let val = editorRef.current.innerHTML;
      if (val === '<br>') val = '';
      hiddenInputRef.current.value = val;
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
      <input type="hidden" name={name} ref={hiddenInputRef} defaultValue={defaultValue} required={required} />

      {/* Editor */}
      <div
        ref={editorRef}
        className={cn(
          "p-3 min-h-[120px] max-h-[300px] overflow-y-auto focus:outline-none text-sm text-gray-700",
          "prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none"
        )}
        contentEditable
        onInput={handleInput}
        onBlur={() => {setIsFocused(false); handleInput()}}
        onFocus={() => setIsFocused(true)}
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          outline: 'none'
        }}
      />
    </div>
  );
}
