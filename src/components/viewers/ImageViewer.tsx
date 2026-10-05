import React, { useState } from 'react';
import { Image as ImageIcon, ZoomIn, ZoomOut, RotateCw, Download, RefreshCw } from 'lucide-react';

interface ImageViewerProps {
  fileUrl?: string;
  fileName?: string;
  description?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  fileUrl,
  fileName = 'Image.png',
  description,
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const resetView = () => {
    setZoom(100);
    setRotation(0);
  };

  const fallbackUrl = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80';
  const displaySrc = fileUrl || fallbackUrl;

  return (
    <div className="flex flex-col h-full rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/70 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-amber-400" />
          <span className="font-mono font-medium text-neutral-200">{fileName}</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 font-mono tabular-nums">{zoom}% zoom</span>
          {rotation > 0 && (
            <>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400 font-mono tabular-nums">{rotation}°</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
            <button
              onClick={() => setZoom((z) => Math.max(25, z - 20))}
              title="Zoom Out"
              className="p-0.5 text-neutral-400 hover:text-white"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(300, z + 20))}
              title="Zoom In"
              className="p-0.5 text-neutral-400 hover:text-white"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate 90 degrees"
              className="p-0.5 text-neutral-400 hover:text-white ml-1"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={resetView}
              title="Reset View"
              className="p-0.5 text-neutral-400 hover:text-white ml-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <a
            href={displaySrc}
            download={fileName}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Image Canvas with checkerboard dark pattern */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-neutral-900/30">
        <div
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-neutral-800"
        >
          <img
            src={displaySrc}
            alt={fileName}
            className="max-w-full max-h-[70vh] object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackUrl;
            }}
          />
        </div>
      </div>

      {description && (
        <div className="border-t border-neutral-800 bg-neutral-900/40 px-4 py-2 text-xs text-neutral-400">
          {description}
        </div>
      )}
    </div>
  );
};
