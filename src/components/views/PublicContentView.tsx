import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ContentItem } from '../../types';
import { MarkdownViewer } from '../viewers/MarkdownViewer';
import { CodeViewer } from '../viewers/CodeViewer';
import { ExcelViewer } from '../viewers/ExcelViewer';
import { WordViewer } from '../viewers/WordViewer';
import { PDFViewer } from '../viewers/PDFViewer';
import { ImageViewer } from '../viewers/ImageViewer';
import { VideoViewer } from '../viewers/VideoViewer';
import {
  Share2,
  Download,
  Check,
  Globe,
  Layers,
  Calendar,
  FileText,
  ArrowLeft,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface PublicContentViewProps {
  slug: string;
  onNavigateHome: () => void;
  onOpenApp: () => void;
}

export const PublicContentView: React.FC<PublicContentViewProps> = ({
  slug,
  onNavigateHome,
  onOpenApp,
}) => {
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await api.getPublicContent(slug);
        setContent(item);
      } catch (err: any) {
        setError(err.message || 'This document is either private, unpublished, or does not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-neutral-300">Resolving public document artifact...</p>
        <p className="text-xs text-neutral-500 mt-1">No authentication credentials required.</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="mx-auto max-w-lg min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 mb-4">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-100">Document Unavailable</h2>
        <p className="mt-2 text-xs leading-relaxed text-neutral-400">
          {error || 'This content has not been published or the slug URL has expired.'}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Landing Page</span>
          </button>
          <button
            onClick={onOpenApp}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Enter Console
          </button>
        </div>
      </div>
    );
  }

  const renderViewer = () => {
    switch (content.content_type) {
      case 'markdown':
        return <MarkdownViewer value={content.body_text || ''} isEditable={false} />;
      case 'code':
        return <CodeViewer value={content.body_text || ''} fileName={content.file_name || 'script.py'} isEditable={false} />;
      case 'excel':
        return <ExcelViewer value={content.body_text} fileUrl={content.file_url} fileName={content.file_name || 'Spreadsheet.xlsx'} />;
      case 'word':
        return <WordViewer value={content.body_text} fileUrl={content.file_url} fileName={content.file_name || 'Document.docx'} />;
      case 'pdf':
        return <PDFViewer fileUrl={content.file_url} fileName={content.file_name || 'Document.pdf'} value={content.body_text} />;
      case 'image':
        return <ImageViewer fileUrl={content.file_url} fileName={content.file_name || 'Image.png'} description={content.body_text} />;
      case 'video':
        return <VideoViewer fileUrl={content.file_url} fileName={content.file_name || 'Video.mp4'} description={content.body_text} />;
      default:
        return (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {content.body_text || 'No text content available.'}
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Top Banner & Breadcrumb */}
      <div className="mb-6 flex flex-col gap-4 border-b border-neutral-800/80 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          {/* Breadcrumb unboxed */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
            <button onClick={onNavigateHome} className="hover:text-neutral-200 transition-colors">
              OmniSpace
            </button>
            <span aria-hidden="true">/</span>
            <span>{content.workspace?.name || 'Public Workspace'}</span>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-300">{content.project?.name || 'Public Project'}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">
            {content.title}
          </h1>

          {/* Clean unboxed metadata with typographic separators */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <span className="font-mono text-indigo-400 uppercase tracking-wider text-[11px] font-semibold">
              {content.content_type}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Globe className="h-3.5 w-3.5" />
              <span>Public Access</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Published {new Date(content.created_at).toLocaleDateString()}</span>
            {content.file_size && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{(content.file_size / 1024).toFixed(1)} KB</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share Link'}</span>
          </button>

          {content.file_url ? (
            <a
              href={`/api/public/download/${content.slug}`}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </a>
          ) : (
            <button
              onClick={() => {
                const blob = new Blob([content.body_text || ''], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${content.slug}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Text</span>
            </button>
          )}

          <button
            onClick={onOpenApp}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <span>Open in Console</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Document Viewer Container */}
      <div className="h-[75vh] w-full">{renderViewer()}</div>
    </div>
  );
};
