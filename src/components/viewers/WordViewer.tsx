import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { FileText, Printer, Download, BookOpen } from 'lucide-react';

interface WordViewerProps {
  value?: string;
  fileUrl?: string;
  fileName?: string;
}

export const WordViewer: React.FC<WordViewerProps> = ({
  value = '',
  fileUrl,
  fileName = 'Document.docx',
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseWordDoc = async () => {
      setLoading(true);
      setError(null);
      try {
        if (fileUrl) {
          const res = await fetch(fileUrl);
          const arrayBuffer = await res.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setHtmlContent(result.value);
        } else if (value && value.includes('<')) {
          // If already converted or HTML provided
          setHtmlContent(value);
        } else {
          // Fallback rich executive formatted text
          setHtmlContent(
            value
              ? `<div class="p-4 leading-relaxed">${value.replace(/\n/g, '<br/>')}</div>`
              : `<h1>Executive Architecture Specification</h1>
                 <p class="lead">Prepared for system audit review</p>
                 <hr/>
                 <h2>1. Objective</h2>
                 <p>This document formalizes the storage tier boundaries, access token invalidation protocols, and workspace hierarchies.</p>
                 <h2>2. Core Mandates</h2>
                 <ul>
                   <li>Strict isolation between workspace tenants</li>
                   <li>Zero-latency permission inheritance</li>
                   <li>Audited cryptographic token signing</li>
                 </ul>`
          );
        }
      } catch (err: any) {
        setError(`Unable to parse .docx file: ${err.message || 'Unknown format'}`);
      } finally {
        setLoading(false);
      }
    };

    parseWordDoc();
  }, [value, fileUrl]);

  const wordCount = htmlContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span>Parsing Word .docx document structure...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Top Bar with metadata and print/download */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/70 px-4 py-2 text-xs">
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="font-mono font-medium text-neutral-200">{fileName}</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 font-mono tabular-nums">{wordCount} words</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 font-mono tabular-nums">~{readTimeMin} min read</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            title="Print Document"
            className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Document Paper Container */}
      <div className="flex-1 overflow-auto bg-neutral-900/40 p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-3xl rounded-lg border border-neutral-800 bg-neutral-950 p-8 md:p-12 shadow-xl min-h-[800px] text-neutral-200">
          <div
            className="word-docx-content prose prose-invert prose-neutral max-w-none prose-headings:text-neutral-100 prose-p:leading-relaxed prose-p:text-neutral-300 prose-li:text-neutral-300 prose-table:border prose-table:border-neutral-800 prose-th:bg-neutral-900 prose-th:p-2 prose-td:border-t prose-td:border-neutral-800 prose-td:p-2"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  );
};
