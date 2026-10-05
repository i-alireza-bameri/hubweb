import React, { useState } from 'react';
import { api } from '../../api/client';
import { Workspace, Project, ContentItem, ContentType } from '../../types';
import { X, FolderPlus, Layers, FileCode, PlusCircle } from 'lucide-react';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  projects: Project[];
  activeWorkspaceId: number;
  activeProjectId?: number;
  onWorkspaceCreated: (ws: Workspace) => void;
  onProjectCreated: (prj: Project) => void;
  onContentCreated: (cnt: ContentItem) => void;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  projects,
  activeWorkspaceId,
  activeProjectId,
  onWorkspaceCreated,
  onProjectCreated,
  onContentCreated,
}) => {
  const [kind, setKind] = useState<'content' | 'project' | 'workspace'>('content');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<ContentType>('markdown');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<number>(activeWorkspaceId || workspaces[0]?.id || 1);
  const [targetProjectId, setTargetProjectId] = useState<number>(activeProjectId || projects[0]?.id || 1);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    setError(null);

    try {
      if (kind === 'workspace') {
        const ws = await api.createWorkspace({ name, description });
        onWorkspaceCreated(ws);
        onClose();
      } else if (kind === 'project') {
        const prj = await api.createProject({
          workspace_id: targetWorkspaceId,
          name,
          description,
          is_published: isPublished,
        });
        onProjectCreated(prj);
        onClose();
      } else {
        const initialText =
          contentType === 'markdown'
            ? `# ${name}\n\nStart writing documentation here...`
            : contentType === 'code'
            ? `# ${name}\n\ndef main():\n    print("OmniSpace initialized")\n`
            : '';

        const cnt = await api.createContent({
          project_id: targetProjectId,
          title: name,
          content_type: contentType,
          body_text: initialText,
          is_published: isPublished,
        });
        onContentCreated(cnt);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => p.workspace_id === targetWorkspaceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <PlusCircle className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-neutral-100">Create New Item</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Kind selector tabs */}
        <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-neutral-900 p-1 border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setKind('content')}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              kind === 'content' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Document
          </button>
          <button
            type="button"
            onClick={() => setKind('project')}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              kind === 'project' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Project
          </button>
          <button
            type="button"
            onClick={() => setKind('workspace')}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              kind === 'workspace' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Workspace
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              {kind === 'workspace' ? 'Workspace Name' : kind === 'project' ? 'Project Name' : 'Document Title'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                kind === 'workspace'
                  ? 'e.g., Enterprise Core Lab'
                  : kind === 'project'
                  ? 'e.g., Q4 API Modernization'
                  : 'e.g., Microservice Architecture Specs'
              }
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-3 text-xs text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {kind === 'content' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-3 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="markdown">Markdown Document (.md)</option>
                <option value="code">Source Code / Script (.py, .ts, etc.)</option>
                <option value="text">Plain Text Document (.txt)</option>
              </select>
            </div>
          )}

          {kind === 'project' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Parent Workspace
              </label>
              <select
                value={targetWorkspaceId}
                onChange={(e) => setTargetWorkspaceId(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-3 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {kind === 'content' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Parent Project
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-3 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
              >
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary or scope details..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 px-3 text-xs text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {(kind === 'project' || kind === 'content') && (
            <div className="flex items-center gap-2 pt-1">
              <input
                id="modal-pub"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="modal-pub" className="text-xs text-neutral-300 cursor-pointer select-none">
                Make publicly viewable (No auth required for viewers)
              </label>
            </div>
          )}

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
              disabled={loading || !name}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : `Create ${kind.charAt(0).toUpperCase() + kind.slice(1)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
