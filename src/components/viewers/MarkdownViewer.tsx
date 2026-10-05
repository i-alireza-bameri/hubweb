import React, { useState } from 'react';
import { Bold, Italic, Code, Heading1, Heading2, List, CheckSquare, Quote, Table as TableIcon, Copy, Check, Eye, Edit3, Columns } from 'lucide-react';

interface MarkdownViewerProps {
  value: string;
  onChange?: (val: string) => void;
  isEditable?: boolean;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  value,
  onChange,
  isEditable = false,
}) => {
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>(isEditable ? 'split' : 'preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertText = (before: string, after: string = '') => {
    if (!onChange) return;
    const textarea = document.getElementById('markdown-editor-area') as HTMLTextAreaElement | null;
    if (!textarea) {
      onChange(value + '\n' + before + after);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const replacement = before + (selected || 'text') + after;
    const updated = value.substring(0, start) + replacement + value.substring(end);
    onChange(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected.length || 4));
    }, 10);
  };

  // Simple, resilient parser for markdown without heavy external vulnerable deps
  const renderMarkdown = (text: string) => {
    if (!text) {
      return (
        <div className="py-12 text-center text-neutral-500 italic">
          No content written yet. Start typing in the editor.
        </div>
      );
    }

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    let tableBuffer: string[] = [];

    const flushTable = (index: number) => {
      if (tableBuffer.length === 0) return null;
      const rows = tableBuffer.map(r => r.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length));
      const validRows = rows.filter(r => !r.every(cell => /^[-:\s]+$/.test(cell)));
      tableBuffer = [];
      if (validRows.length === 0) return null;

      const header = validRows[0];
      const body = validRows.slice(1);

      return (
        <div key={`table-${index}`} className="my-4 overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/70 text-xs font-semibold text-neutral-300">
              <tr>
                {header.map((col, cIdx) => (
                  <th key={cIdx} className="px-4 py-2.5 font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 bg-neutral-950/40 text-neutral-300">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-neutral-900/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 font-mono text-xs">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.trim().substring(3).trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <div key={`code-${i}`} className="my-4 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/90 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-1.5 text-xs text-neutral-400 font-mono">
                <span>{codeLanguage || 'code'}</span>
                <span className="text-[10px] text-neutral-500">{codeBuffer.length} lines</span>
              </div>
              <pre className="p-4 font-mono text-xs leading-relaxed text-neutral-200 overflow-x-auto">
                <code>{codeBuffer.join('\n')}</code>
              </pre>
            </div>
          );
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Tables
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        tableBuffer.push(line);
        if (i === lines.length - 1 || !lines[i + 1].trim().startsWith('|')) {
          const tableElem = flushTable(i);
          if (tableElem) elements.push(tableElem);
        }
        continue;
      } else if (tableBuffer.length > 0) {
        const tableElem = flushTable(i);
        if (tableElem) elements.push(tableElem);
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="mt-6 mb-3 text-2xl font-bold tracking-tight text-neutral-100 border-b border-neutral-800/80 pb-2">
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="mt-5 mb-2 text-xl font-semibold tracking-tight text-neutral-200">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="mt-4 mb-2 text-base font-medium text-neutral-200">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="my-3 border-l-2 border-indigo-500/70 pl-4 py-1 italic text-neutral-400 text-sm">
            {line.substring(2)}
          </blockquote>
        );
      } else if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')) {
        const checked = line.trim().startsWith('- [x] ');
        elements.push(
          <div key={i} className="flex items-center gap-2.5 my-1.5 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-0 cursor-default"
            />
            <span className={checked ? 'line-through text-neutral-500' : ''}>
              {line.trim().substring(6)}
            </span>
          </div>
        );
      } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <li key={i} className="ml-5 list-disc text-sm text-neutral-300 leading-relaxed my-0.5">
            {formatInlineText(line.trim().substring(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(line.trim())) {
        const textPart = line.trim().replace(/^\d+\.\s/, '');
        elements.push(
          <li key={i} className="ml-5 list-decimal text-sm text-neutral-300 leading-relaxed my-0.5">
            {formatInlineText(textPart)}
          </li>
        );
      } else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={i} className="my-6 border-neutral-800" />);
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(
          <p key={i} className="text-sm leading-relaxed text-neutral-300 my-1">
            {formatInlineText(line)}
          </p>
        );
      }
    }

    return elements;
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Basic bold, inline code, italic
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/`([^`]+)`/);
      // Bold
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

      if (codeMatch && (!boldMatch || codeMatch.index! < boldMatch.index!)) {
        const prefix = remaining.substring(0, codeMatch.index!);
        if (prefix) parts.push(prefix);
        parts.push(
          <code key={`c-${keyIdx++}`} className="rounded bg-neutral-800/80 px-1.5 py-0.5 font-mono text-xs text-indigo-300 border border-neutral-700/50">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.substring(codeMatch.index! + codeMatch[0].length);
      } else if (boldMatch) {
        const prefix = remaining.substring(0, boldMatch.index!);
        if (prefix) parts.push(prefix);
        parts.push(
          <strong key={`b-${keyIdx++}`} className="font-semibold text-neutral-100">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.substring(boldMatch.index! + boldMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Editor & Viewer Toolbar */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs">
        {/* Left: formatting shortcuts */}
        {isEditable ? (
          <div className="flex items-center gap-1">
            <button onClick={() => insertText('# ', '')} title="Heading 1" className="rounded p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200">
              <Heading1 className="h-4 w-4" />
            </button>
            <button onClick={() => insertText('## ', '')} title="Heading 2" className="rounded p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200">
              <Heading2 className="h-4 w-4" />
            </button>
            <div className="h-4 w-[1px] bg-neutral-800 mx-1" />
            <button onClick={() => insertText('**', '**')} title="Bold" className="rounded p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200">
              <Bold className="h-4 w-4" />
            </button>
            <button onClick={() => insertText('*', '*')} title="Italic" className="rounded p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200">
              <Italic className="h-4 w-4" />
            </button>
            <button onClick={() => insertText('`', '`')} title="Inline Code" className="rounded p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200">
              <Code className="h-4 w-4" />
            </button>
            <div className="h-4 w-[1px] bg-neutral-800 mx-1" />
            <button onClick={() => insertText('- ', '')} title="Bullet List" className="rounded p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200">
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => insertText('- [ ] ', '')} title="Checklist" className="rounded p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200">
              <CheckSquare className="h-4 w-4" />
            </button>
            <button onClick={() => insertText('> ', '')} title="Quote" className="rounded p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200">
              <Quote className="h-4 w-4" />
            </button>
            <button onClick={() => insertText('| Col 1 | Col 2 |\n| :--- | :--- |\n| Val 1 | Val 2 |\n', '')} title="Table" className="rounded p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200">
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="font-mono text-[11px]">MARKDOWN FORMAT</span>
          </div>
        )}

        {/* Right: View mode controls & copy */}
        <div className="flex items-center gap-2">
          {isEditable && (
            <div className="flex items-center bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
              <button
                onClick={() => setMode('edit')}
                className={`px-2 py-1 rounded text-xs transition-colors ${mode === 'edit' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
                title="Edit Only"
              >
                <Edit3 className="h-3.5 w-3.5 inline mr-1" />
                Edit
              </button>
              <button
                onClick={() => setMode('split')}
                className={`px-2 py-1 rounded text-xs transition-colors ${mode === 'split' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
                title="Split View"
              >
                <Columns className="h-3.5 w-3.5 inline mr-1" />
                Split
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`px-2 py-1 rounded text-xs transition-colors ${mode === 'preview' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
                title="Preview Only"
              >
                <Eye className="h-3.5 w-3.5 inline mr-1" />
                Preview
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            title="Copy Raw Markdown"
            className="flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden h-[calc(100%-41px)]">
        {/* Editor Area */}
        {isEditable && (mode === 'edit' || mode === 'split') && (
          <div className={`h-full border-r border-neutral-800 bg-neutral-950 p-4 overflow-y-auto ${mode === 'edit' ? 'col-span-2' : ''}`}>
            <textarea
              id="markdown-editor-area"
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder="Write Markdown here..."
              className="h-full w-full resize-none bg-transparent font-mono text-xs leading-relaxed text-neutral-200 placeholder-neutral-600 focus:outline-none"
              spellCheck="false"
            />
          </div>
        )}

        {/* Live Preview Area */}
        {(mode === 'preview' || mode === 'split') && (
          <div className={`h-full overflow-y-auto p-6 bg-neutral-950/60 ${mode === 'preview' ? 'col-span-2' : ''}`}>
            <div className="max-w-3xl mx-auto prose prose-invert prose-sm">
              {renderMarkdown(value)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
