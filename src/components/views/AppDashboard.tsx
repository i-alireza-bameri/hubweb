import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Workspace, Project, ContentItem, User, ContentType } from '../../types';
import { MarkdownViewer } from '../viewers/MarkdownViewer';
import { CodeViewer } from '../viewers/CodeViewer';
import { ExcelViewer } from '../viewers/ExcelViewer';
import { WordViewer } from '../viewers/WordViewer';
import { PDFViewer } from '../viewers/PDFViewer';
import { ImageViewer } from '../viewers/ImageViewer';
import { VideoViewer } from '../viewers/VideoViewer';
import { NewItemModal } from '../modals/NewItemModal';
import { UploadModal } from '../modals/UploadModal';
import {
  Layers,
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Film,
  Plus,
  UploadCloud,
  Search,
  ChevronDown,
  ChevronRight,
  Globe,
  Share2,
  Trash2,
  Download,
  Save,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface AppDashboardProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onViewPublicDoc: (slug: string) => void;
}

export const AppDashboard: React.FC<AppDashboardProps> = ({
  currentUser,
  onOpenAuth,
  onViewPublicDoc,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null);
  const [expandedProjectIds, setExpandedProjectIds] = useState<number[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Edit buffer
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  // Initial data loading
  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [wsList, prjList, cntList] = await Promise.all([
          api.listWorkspaces(),
          api.listProjects(),
          api.listContents(),
        ]);
        setWorkspaces(wsList);
        setProjects(prjList);
        setContents(cntList);

        if (wsList.length > 0) {
          const firstWs = wsList[0];
          setActiveWorkspaceId(firstWs.id);
          const firstWsProjects = prjList.filter((p) => p.workspace_id === firstWs.id);
          if (firstWsProjects.length > 0) {
            setExpandedProjectIds([firstWsProjects[0].id]);
            const firstContent = cntList.find((c) => c.project_id === firstWsProjects[0].id);
            if (firstContent) {
              setSelectedContentId(firstContent.id);
              setEditTitle(firstContent.title);
              setEditBody(firstContent.body_text || '');
            }
          }
        }
      } catch (err: any) {
        showToast('Error loading workspace data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Sync edit buffer when selected content changes
  useEffect(() => {
    if (selectedContentId) {
      const item = contents.find((c) => c.id === selectedContentId);
      if (item) {
        setEditTitle(item.title);
        setEditBody(item.body_text || '');
      }
    }
  }, [selectedContentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const activeProjects = projects.filter((p) => p.workspace_id === activeWorkspaceId);
  const selectedContent = contents.find((c) => c.id === selectedContentId);
  const selectedProject = selectedContent ? projects.find((p) => p.id === selectedContent.project_id) : null;

  const toggleProjectExpand = (id: number) => {
    setExpandedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSaveContent = async () => {
    if (!selectedContent) return;
    setSaving(true);
    try {
      const updated = await api.updateContent(selectedContent.id, {
        title: editTitle,
        body_text: editBody,
      });
      setContents((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast('Document saved successfully');
    } catch {
      showToast('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!selectedContent) return;
    try {
      const updated = await api.updateContent(selectedContent.id, {
        is_published: !selectedContent.is_published,
      });
      setContents((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast(updated.is_published ? 'Document published to /d/:slug' : 'Document unpublished (Private)');
    } catch {
      showToast('Failed to change publishing status');
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedContent) return;
    if (!confirm(`Are you sure you want to delete "${selectedContent.title}"?`)) return;

    try {
      await api.deleteContent(selectedContent.id);
      setContents((prev) => prev.filter((c) => c.id !== selectedContent.id));
      setSelectedContentId(null);
      showToast('Document deleted');
    } catch {
      showToast('Failed to delete document');
    }
  };

  const handleCopyShareLink = () => {
    if (!selectedContent) return;
    const url = `${window.location.origin}/d/${selectedContent.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('Public link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />;
      case 'code':
        return <FileCode className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
      case 'excel':
        return <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
      case 'word':
        return <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
      case 'pdf':
        return <FileText className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
      case 'image':
        return <ImageIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
      case 'video':
        return <Film className="h-3.5 w-3.5 text-violet-400 shrink-0" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-neutral-400 shrink-0" />;
    }
  };

  // Render Editor/Viewer
  const renderActiveViewer = () => {
    if (!selectedContent) return null;

    switch (selectedContent.content_type) {
      case 'markdown':
        return (
          <MarkdownViewer
            value={editBody}
            onChange={(val) => setEditBody(val)}
            isEditable={true}
          />
        );
      case 'code':
        return (
          <CodeViewer
            value={editBody}
            onChange={(val) => setEditBody(val)}
            fileName={selectedContent.file_name || `${selectedContent.title.replace(/\s+/g, '_')}.py`}
            isEditable={true}
          />
        );
      case 'excel':
        return (
          <ExcelViewer
            value={selectedContent.body_text}
            fileUrl={selectedContent.file_url}
            fileName={selectedContent.file_name || `${selectedContent.title}.xlsx`}
          />
        );
      case 'word':
        return (
          <WordViewer
            value={selectedContent.body_text}
            fileUrl={selectedContent.file_url}
            fileName={selectedContent.file_name || `${selectedContent.title}.docx`}
          />
        );
      case 'pdf':
        return (
          <PDFViewer
            fileUrl={selectedContent.file_url}
            fileName={selectedContent.file_name || `${selectedContent.title}.pdf`}
            value={selectedContent.body_text}
          />
        );
      case 'image':
        return (
          <ImageViewer
            fileUrl={selectedContent.file_url}
            fileName={selectedContent.file_name || `${selectedContent.title}.png`}
            description={selectedContent.body_text}
          />
        );
      case 'video':
        return (
          <VideoViewer
            fileUrl={selectedContent.file_url}
            fileName={selectedContent.file_name || `${selectedContent.title}.mp4`}
            description={selectedContent.body_text}
          />
        );
      default:
        return (
          <div className="flex flex-col h-full rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="flex-1 resize-none bg-transparent font-mono text-xs leading-relaxed text-neutral-200 focus:outline-none focus:ring-0"
            />
          </div>
        );
    }
  };

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-indigo-400 mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-100">Authentication Required</h2>
        <p className="mt-2 text-xs leading-relaxed text-neutral-400">
          Sign in or create an account to access private workspaces, project hierarchies, and the
          management console.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Sign In / Demo Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-neutral-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-neutral-200 shadow-xl flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar: Workspace & Project Tree */}
      <aside className="w-72 shrink-0 border-r border-neutral-800 bg-neutral-950 flex flex-col">
        {/* Workspace Selector Bar */}
        <div className="p-3 border-b border-neutral-800/80">
          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1 block">
            Workspace
          </label>
          <div className="flex items-center gap-1.5">
            <select
              value={activeWorkspaceId || ''}
              onChange={(e) => setActiveWorkspaceId(parseInt(e.target.value, 10))}
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 px-2.5 text-xs font-semibold text-neutral-200 focus:border-indigo-500 focus:outline-none truncate"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsNewItemOpen(true)}
              title="Add New Workspace / Project / Content"
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
          <button
            onClick={() => setIsNewItemOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/60 py-1 text-[11px] font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            <span>New Item</span>
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/60 py-1 text-[11px] font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-neutral-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search contents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-neutral-800 bg-neutral-900/60 py-1 pl-8 pr-2 text-xs text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Hierarchy Tree (Workspace -> Projects -> Contents) */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeProjects.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-500">
              No projects in this workspace. Click &quot;New Item&quot; to create one.
            </div>
          ) : (
            activeProjects.map((project) => {
              const isExpanded = expandedProjectIds.includes(project.id);
              const projectContents = contents.filter((c) => c.project_id === project.id);
              const filteredContents = searchQuery
                ? projectContents.filter((c) =>
                    c.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : projectContents;

              return (
                <div key={project.id} className="rounded-lg overflow-hidden">
                  {/* Project Accordion Header */}
                  <div
                    onClick={() => toggleProjectExpand(project.id)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:bg-neutral-900 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      ) : (
                        <Folder className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      )}
                      <span className="truncate">{project.name}</span>
                    </div>

                    <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
                      {projectContents.length}
                    </span>
                  </div>

                  {/* Contents inside Project */}
                  {isExpanded && (
                    <div className="ml-5 pl-2 border-l border-neutral-800 space-y-0.5 my-0.5">
                      {filteredContents.length === 0 ? (
                        <div className="py-1 text-[11px] text-neutral-600 italic">
                          No items
                        </div>
                      ) : (
                        filteredContents.map((c) => {
                          const isSelected = selectedContentId === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedContentId(c.id)}
                              className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors group ${
                                isSelected
                                  ? 'bg-indigo-950/60 text-indigo-200 font-medium'
                                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {getContentIcon(c.content_type)}
                                <span className="truncate">{c.title}</span>
                              </div>

                              {c.is_published && (
                                <span title="Published publicly">
                                  <Globe className="h-3 w-3 text-emerald-400/80 shrink-0 ml-1" />
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info: SQLite/PostgreSQL ready */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
          <span>Engine: SQLModel (SQLite)</span>
          <span className="text-indigo-400 font-semibold">JWT Active</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
        {selectedContent ? (
          <>
            {/* Document Header & Controls */}
            <div className="border-b border-neutral-800 bg-neutral-950 px-6 py-3">
              {/* Context Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                <span>{activeWorkspace?.name || 'Workspace'}</span>
                <span aria-hidden="true">/</span>
                <span>{selectedProject?.name || 'Project'}</span>
                <span aria-hidden="true">/</span>
                <span className="text-neutral-300 font-mono text-[11px] uppercase">
                  {selectedContent.content_type}
                </span>
              </div>

              {/* Title & Actions Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent text-xl font-bold tracking-tight text-neutral-100 focus:outline-none focus:ring-0 truncate"
                  placeholder="Document Title"
                />

                <div className="flex items-center gap-2 shrink-0">
                  {/* Publish Toggle Button */}
                  <button
                    onClick={handleTogglePublish}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                      selectedContent.is_published
                        ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/60'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>{selectedContent.is_published ? 'Published' : 'Private'}</span>
                  </button>

                  {/* Share Link if published */}
                  {selectedContent.is_published && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleCopyShareLink}
                        title="Copy Public Link (/d/:slug)"
                        className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                      >
                        {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">Copy Link</span>
                      </button>

                      <button
                        onClick={() => onViewPublicDoc(selectedContent.slug)}
                        title="Preview Public Page"
                        className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Save button for text/code/markdown */}
                  {['markdown', 'code', 'text'].includes(selectedContent.content_type) && (
                    <button
                      onClick={handleSaveContent}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                  )}

                  {/* Download */}
                  {selectedContent.file_url ? (
                    <a
                      href={`/api/contents/${selectedContent.id}/download`}
                      download={selectedContent.file_name || 'download'}
                      className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  ) : null}

                  {/* Delete */}
                  <button
                    onClick={handleDeleteContent}
                    title="Delete document"
                    className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-red-800/80 hover:bg-red-950/40 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Viewer / Editor Main Canvas */}
            <div className="flex-1 p-4 md:p-6 overflow-hidden">
              {renderActiveViewer()}
            </div>
          </>
        ) : (
          /* Empty / Workspace Overview View */
          <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
                {activeWorkspace?.name || 'Workspace Dashboard'}
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                {activeWorkspace?.description || 'Select a document from the left tree or create new contents.'}
              </p>
            </div>

            {/* Quick Metrics (Clean tabular discipline, no pills) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-5">
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  Active Projects
                </div>
                <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100">
                  {activeProjects.length}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-5">
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  Total Documents
                </div>
                <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100">
                  {contents.length}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-5">
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  Published Artifacts
                </div>
                <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-400">
                  {contents.filter((c) => c.is_published).length}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button
                onClick={() => setIsNewItemOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Document</span>
              </button>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                <UploadCloud className="h-4 w-4 text-emerald-400" />
                <span>Upload PDF / Excel / Word / Media</span>
              </button>
            </div>

            {/* Recent Files List */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-200 mb-3">
                Recent Workspace Contents
              </h3>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/20 divide-y divide-neutral-800/80 overflow-hidden">
                {contents.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContentId(c.id)}
                    className="flex items-center justify-between p-3.5 hover:bg-neutral-900/60 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {getContentIcon(c.content_type)}
                      <span className="font-medium text-neutral-200 hover:text-white">
                        {c.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-neutral-500 font-mono text-[11px]">
                      {c.is_published && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>Published</span>
                        </span>
                      )}
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NewItemModal
        isOpen={isNewItemOpen}
        onClose={() => setIsNewItemOpen(false)}
        workspaces={workspaces}
        projects={projects}
        activeWorkspaceId={activeWorkspaceId || 1}
        onWorkspaceCreated={(ws) => {
          setWorkspaces((prev) => [...prev, ws]);
          setActiveWorkspaceId(ws.id);
          showToast(`Workspace "${ws.name}" created`);
        }}
        onProjectCreated={(prj) => {
          setProjects((prev) => [...prev, prj]);
          setExpandedProjectIds((prev) => [...prev, prj.id]);
          showToast(`Project "${prj.name}" created`);
        }}
        onContentCreated={(cnt) => {
          setContents((prev) => [...prev, cnt]);
          setSelectedContentId(cnt.id);
          showToast(`Document "${cnt.title}" created`);
        }}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        projects={projects}
        defaultProjectId={activeProjects[0]?.id}
        onSuccess={(cnt) => {
          setContents((prev) => [...prev, cnt]);
          setSelectedContentId(cnt.id);
          showToast(`File "${cnt.file_name || cnt.title}" uploaded`);
        }}
      />
    </div>
  );
};
