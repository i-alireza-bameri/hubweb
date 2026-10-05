import React, { useState } from 'react';
import { FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Search } from 'lucide-react';

interface PDFViewerProps {
  fileUrl?: string;
  fileName?: string;
  value?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fileName = 'Document.pdf',
  value,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;
  const [zoom, setZoom] = useState(100);
  const [showThumbnails, setShowThumbnails] = useState(true);

  // If real PDF fileUrl exists and can be rendered in iframe:
  const isDirectPdf = fileUrl && fileUrl.endsWith('.pdf');

  const pagesContent = [
    {
      page: 1,
      title: 'Chapter 1: Distributed Workspace Topology',
      subtitle: 'System Invariants & Storage Layer Partitioning',
      body: `OmniSpace implements a deterministic partitioning tree where Workspaces act as physical isolation boundaries for data sovereignty, while Projects define logical grouping namespaces.

Key Architecture Principles:
1. Workspace Level: Tenant isolation, cryptographic secret derivation, and resource quota boundaries.
2. Project Level: Access lifecycle, staging vs. published toggle states, and artifact version control.
3. Content Level: Granular ownership verification, mime-type specific decoding pipelines, and public slug exposure.`,
    },
    {
      page: 2,
      title: 'Chapter 2: Authentication & Token Lifecycle',
      subtitle: 'JWT Claims & Bearer Verification Specification',
      body: `All internal communication is secured via HS256-signed JWTs containing subject identifier (sub), username, and issued-at expiration offsets.

Token Validation Flow:
- Clients attach Bearer token via Authorization header.
- The FastAPI auth dependency decodes claims against SECRET_KEY.
- Ownership checks verify: workspace.owner_id == token.sub before allowing mutation.
- Strawberry GraphQL maps context.request headers directly to the resolver execution scope.`,
    },
    {
      page: 3,
      title: 'Chapter 3: High-Throughput Document Processing',
      subtitle: 'Excel, Word, Code, and Binary Streaming',
      body: `Content objects ingest raw binary payloads through FastAPI UploadFile streaming pipes directly onto persistent NVMe storage.

Format Handlers:
- Excel (.xlsx, .xls): Direct binary parsing with multi-sheet array-of-arrays extraction.
- Word (.docx): XML zip unpacking, text node reconstruction, and structured HTML semantic styling.
- PDF & Media: Range-request streaming with chunked byte transfer for low-latency playback.`,
    },
    {
      page: 4,
      title: 'Chapter 4: Public Distribution & Publishing SLAs',
      subtitle: 'Slug-based Zero-Auth Access Protocol',
      body: `When an authorized workspace owner toggles content publishing:
- A unique cryptographic 8-character hex hash is combined with the sanitized title.
- The document is registered in the public cache lookup index.
- Public requests to /d/:slug bypass JWT authentication filters completely.
- Edge headers enforce public caching while preserving instant invalidation capability.`,
    },
  ];

  const activePageData = pagesContent[currentPage - 1] || pagesContent[0];

  return (
    <div className="flex flex-col h-full rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-4 py-2 text-xs gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-rose-400" />
          <span className="font-mono font-medium text-neutral-200">{fileName}</span>
          <span className="text-neutral-600">·</span>
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {showThumbnails ? 'Hide Pages' : 'Show Pages'}
          </button>
        </div>

        {/* Page Nav */}
        <div className="flex items-center gap-2 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-neutral-300 tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Zoom & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              className="p-0.5 text-neutral-400 hover:text-white"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[11px] text-neutral-300 w-10 text-center tabular-nums">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(180, z + 15))}
              className="p-0.5 text-neutral-400 hover:text-white"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {fileUrl && (
            <a
              href={fileUrl}
              download={fileName}
              className="flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Canvas + Thumbnails */}
      <div className="flex-1 flex overflow-hidden bg-neutral-900/40">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <div className="w-48 border-r border-neutral-800 bg-neutral-950/60 p-3 overflow-y-auto hidden sm:block">
            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Document Pages
            </div>
            <div className="space-y-3">
              {pagesContent.map((item) => (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className={`w-full text-left rounded-lg p-2 transition-all border ${
                    currentPage === item.page
                      ? 'border-indigo-500/80 bg-indigo-950/20 text-neutral-100 shadow-sm'
                      : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1">
                    <span>Page {item.page}</span>
                  </div>
                  <div className="text-xs font-medium truncate text-neutral-200">
                    {item.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Page Content View */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-2xl bg-white text-neutral-900 rounded-sm shadow-2xl p-10 md:p-14 min-h-[750px] transition-transform duration-150 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center border-b border-neutral-200 pb-4 mb-6">
                <span className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase">
                  OmniSpace Technical Document
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-950 mb-1">
                {activePageData.title}
              </h1>
              <h2 className="text-sm font-medium text-neutral-500 mb-6">
                {activePageData.subtitle}
              </h2>

              <div className="text-xs md:text-sm leading-relaxed text-neutral-700 whitespace-pre-line font-sans">
                {activePageData.body}
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4 mt-8 flex justify-between items-center text-[10px] font-mono text-neutral-400">
              <span>CONFIDENTIAL &amp; PROPRIETARY</span>
              <span>VERIFIED VIA FASTAPI &amp; SQLMODEL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
