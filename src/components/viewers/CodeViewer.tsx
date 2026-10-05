import React, { useState } from 'react';
import { Copy, Check, FileCode, Play, Terminal } from 'lucide-react';

interface CodeViewerProps {
  value: string;
  onChange?: (val: string) => void;
  isEditable?: boolean;
  fileName?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  value,
  onChange,
  isEditable = false,
  fileName = 'script.py',
}) => {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'slate' | 'cyber'>('slate');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = value ? value.split('\n') : [''];
  const ext = fileName.split('.').pop() || 'py';

  // Highlight syntax keywords softly
  const highlightToken = (token: string, idx: number) => {
    const keywords = ['def', 'class', 'import', 'from', 'return', 'async', 'await', 'if', 'else', 'elif', 'try', 'except', 'const', 'let', 'function', 'interface', 'type', 'export', 'select', 'where', 'from'];
    const types = ['str', 'int', 'bool', 'Optional', 'List', 'Dict', 'string', 'number', 'boolean', 'any', 'void', 'BaseModel'];

    if (keywords.includes(token)) {
      return <span key={idx} className="text-purple-400 font-semibold">{token} </span>;
    }
    if (types.includes(token)) {
      return <span key={idx} className="text-cyan-400">{token} </span>;
    }
    if (token.startsWith('"') || token.startsWith("'")) {
      return <span key={idx} className="text-emerald-400">{token} </span>;
    }
    if (token.startsWith('#') || token.startsWith('//')) {
      return <span key={idx} className="text-neutral-500 italic">{token} </span>;
    }
    return <span key={idx}>{token} </span>;
  };

  return (
    <div className={`flex flex-col h-full rounded-xl border border-neutral-800 overflow-hidden ${theme === 'slate' ? 'bg-neutral-950' : 'bg-[#0d1117]'}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-neutral-300 font-mono">
            <FileCode className="h-4 w-4 text-indigo-400" />
            <span className="font-medium">{fileName}</span>
            <span className="text-[10px] text-neutral-500 uppercase">({ext})</span>
          </div>

          <span className="text-neutral-600">·</span>
          <span className="font-mono text-neutral-400 tabular-nums">{lines.length} lines</span>
          <span className="text-neutral-600">·</span>
          <span className="font-mono text-neutral-400 tabular-nums">{(value.length / 1024).toFixed(1)} KB</span>
        </div>

        <div className="flex items-center gap-2">
          {/* HTML Preview tab if relevant */}
          {(fileName.endsWith('.html') || fileName.endsWith('.svg')) && (
            <div className="flex rounded-md bg-neutral-900 p-0.5 border border-neutral-800">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${activeTab === 'code' ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-400'}`}
              >
                Source
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${activeTab === 'preview' ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-400'}`}
              >
                <Play className="h-3 w-3" />
                Live View
              </button>
            </div>
          )}

          <button
            onClick={() => setTheme(theme === 'slate' ? 'cyber' : 'slate')}
            className="rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200"
          >
            {theme === 'slate' ? 'Dark Slate' : 'Obsidian'}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Editor or Preview */}
      {activeTab === 'preview' && (fileName.endsWith('.html') || fileName.endsWith('.svg')) ? (
        <div className="flex-1 bg-white p-4 overflow-auto">
          <iframe
            srcDoc={value}
            title="Preview"
            sandbox="allow-scripts"
            className="w-full h-full border-0"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto flex text-xs font-mono">
          {/* Line Numbers */}
          <div className="select-none py-4 px-3 text-right bg-neutral-900/30 border-r border-neutral-800/80 text-neutral-600 font-mono tabular-nums leading-relaxed">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Text Body */}
          {isEditable ? (
            <textarea
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              className="flex-1 p-4 bg-transparent text-neutral-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-0 whitespace-pre"
              spellCheck="false"
            />
          ) : (
            <div className="flex-1 p-4 overflow-x-auto text-neutral-200 font-mono text-xs leading-relaxed whitespace-pre">
              {lines.map((l, i) => (
                <div key={i} className="hover:bg-neutral-800/20 px-1 -mx-1 rounded">
                  {l.split(' ').map((tok, tIdx) => highlightToken(tok, tIdx))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
