import React, { useState, useRef } from 'react';
import { api } from '../../api/client';
import { Project, ContentItem } from '../../types';
import { X, UploadCloud, File, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  defaultProjectId?: number;
  onSuccess: (newContent: ContentItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState<number>(defaultProjectId || projects[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose a file to upload');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('project_id', String(projectId));
      formData.append('title', title || selectedFile.name);
      formData.append('is_published', String(isPublished));

      // Determine content_type
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      let detectedType = 'text';
      if (ext === 'pdf') detectedType = 'pdf';
      else if (ext === 'xlsx' || ext === 'xls') detectedType = 'excel';
      else if (ext === 'docx') detectedType = 'word';
      else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext || '')) detectedType = 'image';
      else if (['mp4', 'webm', 'mov'].includes(ext || '')) detectedType = 'video';
      else if (ext === 'md') detectedType = 'markdown';
      else if (['py', 'ts', 'tsx', 'js', 'json', 'html', 'css', 'sql'].includes(ext || '')) detectedType = 'code';

      formData.append('content_type', detectedType);

      const created = await api.uploadFile(formData);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UploadCloud className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-neutral-100">Upload Content File</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-800 bg-neutral-900/40 p-6 text-center cursor-pointer hover:border-neutral-700 hover:bg-neutral-900/70 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.svg,.mp4,.webm,.md,.txt,.py,.ts,.tsx,.js,.json,.html"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-1.5">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <span className="font-mono text-xs font-semibold text-neutral-200">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Click to change file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="h-8 w-8 text-neutral-500" />
                <p className="text-xs text-neutral-300">
                  <span className="text-indigo-400 font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] text-neutral-500">
                  PDF, Word (.docx), Excel (.xlsx), Video, Image, Markdown, Code
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Document Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q4 Revenue Forecast"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-3 text-xs text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Target Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-3 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="upload-pub"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="upload-pub" className="text-xs text-neutral-300 cursor-pointer select-none">
              Publish immediately (Generates public unauthenticated link <code className="text-indigo-400 font-mono">/d/:slug</code>)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Uploading File...' : 'Upload & Create Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
