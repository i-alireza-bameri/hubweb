import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShowcaseItem } from '../../types';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Film,
  Terminal,
  Shield,
  Layers,
  ArrowRight,
  Database,
  Lock,
  Globe,
  CheckCircle2,
  Play,
  Copy,
  Check,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenDoc: (slug: string) => void;
  onOpenGraphQLModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenDoc,
  onOpenGraphQLModal,
}) => {
  const [showcase, setShowcase] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick GraphQL Playground state on Landing Page
  const [liveQuery, setLiveQuery] = useState(`query PublicShowcaseFeed {
  workspaces {
    name
    projects {
      name
      isPublished
    }
  }
}`);
  const [liveResult, setLiveResult] = useState<any>(null);
  const [liveRunning, setLiveRunning] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);

  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        const items = await api.getPublicShowcase();
        setShowcase(items);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchShowcase();
  }, []);

  const runLiveQuery = async () => {
    setLiveRunning(true);
    try {
      const res = await api.executeGraphQL(liveQuery);
      setLiveResult(res.data);
    } catch (err: any) {
      setLiveResult({ error: err.message });
    } finally {
      setLiveRunning(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-4 w-4 text-indigo-400" />;
      case 'code':
        return <FileCode className="h-4 w-4 text-purple-400" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
      case 'word':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-rose-400" />;
      case 'image':
        return <ImageIcon className="h-4 w-4 text-amber-400" />;
      case 'video':
        return <Film className="h-4 w-4 text-violet-400" />;
      default:
        return <FileText className="h-4 w-4 text-neutral-400" />;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-800 bg-neutral-950 py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            {/* Unboxed natural editorial subtitle */}
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-4">
              <span>FastAPI</span>
              <span aria-hidden="true">·</span>
              <span>SQLModel</span>
              <span aria-hidden="true">·</span>
              <span>Strawberry GraphQL</span>
              <span aria-hidden="true">·</span>
              <span>JWT Auth</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl text-balance">
              Unified Content, Workspaces &amp; Projects Engine.
            </h1>

            <p className="mt-5 text-base md:text-lg leading-relaxed text-neutral-400 max-w-2xl">
              Engineered for precision document workflows. Seamlessly organize nested project
              hierarchies, inspect multi-format spreadsheets, Word documents, media, and code
              natively, with instantaneous unauthenticated publishing.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onEnterApp}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-[0.98]"
              >
                <span>Launch Workspace Console</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={onOpenGraphQLModal}
                className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span>GraphQL Playground</span>
              </button>
            </div>
          </div>
        </div>

        {/* Subtle grid background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </section>

      {/* Featured Public Showcase Gallery */}
      <section className="border-b border-neutral-800 bg-neutral-950/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-100 sm:text-2xl">
                Published Artifacts Showcase
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                Explore real, publicly accessible documents and media without requiring login.
              </p>
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              Live URL Scheme: <span className="text-indigo-400">/d/:slug</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl border border-neutral-800 bg-neutral-900/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {showcase.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onOpenDoc(item.slug)}
                  className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 hover:border-neutral-700 hover:bg-neutral-900/80 transition-all cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.content_type)}
                        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                          {item.content_type}
                        </span>
                      </div>
                      <span className="text-neutral-500 font-mono text-[11px]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span className="truncate max-w-[180px]">
                      {item.workspace_name} / {item.project_name}
                    </span>
                    <span className="text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>View</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Live Strawberry GraphQL Explorer Section */}
      <section className="border-b border-neutral-800 bg-neutral-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl font-bold tracking-tight text-neutral-100 sm:text-2xl">
              Native Strawberry GraphQL Execution
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              Run GraphQL queries directly against the typed Python backend. Fully compatible with
              Strawberry schemas, fragments, and queries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden shadow-xl">
            {/* Query Editor */}
            <div className="flex flex-col border-r border-neutral-800 bg-neutral-950 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-xs text-neutral-400">
                <span className="font-mono font-medium text-neutral-300">QUERY DRAFT</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(liveQuery);
                    setCopiedQuery(true);
                    setTimeout(() => setCopiedQuery(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200"
                >
                  {copiedQuery ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedQuery ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <textarea
                rows={8}
                value={liveQuery}
                onChange={(e) => setLiveQuery(e.target.value)}
                className="mt-3 w-full flex-1 resize-none bg-transparent font-mono text-xs leading-relaxed text-indigo-300 focus:outline-none focus:ring-0"
                spellCheck="false"
              />

              <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-end">
                <button
                  onClick={runLiveQuery}
                  disabled={liveRunning}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{liveRunning ? 'Executing...' : 'Run Strawberry Query'}</span>
                </button>
              </div>
            </div>

            {/* Live Response Panel */}
            <div className="flex flex-col bg-neutral-900/50 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-xs text-neutral-400">
                <span className="font-mono font-medium text-neutral-300">OUTPUT DATA</span>
                <span className="text-[10px] font-mono text-emerald-400">READY</span>
              </div>

              <div className="mt-3 flex-1 overflow-auto rounded-lg bg-neutral-950 p-4 border border-neutral-900 min-h-[220px]">
                {liveRunning ? (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-500 font-mono">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mr-2" />
                    Querying /graphql endpoint...
                  </div>
                ) : liveResult ? (
                  <pre className="font-mono text-xs leading-relaxed text-neutral-300">
                    {JSON.stringify(liveResult, null, 2)}
                  </pre>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-500 text-center">
                    Click "Run Strawberry Query" to test real-time GraphQL resolution.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Tech Stack Matrix */}
      <section id="architecture" className="border-b border-neutral-800 bg-neutral-950/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-xl font-bold tracking-tight text-neutral-100 sm:text-2xl">
              System Architecture &amp; Foundations
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              Designed with strict tenant separation, high scannability, and drop-in database flexibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-200">
                Workspace Hierarchy
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                Deterministic 3-tier ownership model (Workspace → Project → Content). Workspaces isolate
                tenants, Projects scope release deliverables, and Contents encapsulate multi-format data.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 mb-4">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-200">
                SQLite ↔ PostgreSQL
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                Zero-setup SQLite by default with automated table bootstrap. Change a single
                DATABASE_URL variable to instantly target enterprise PostgreSQL clusters with zero code changes.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/20 mb-4">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-200">
                Zero-Auth Public Sharing
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                Single-click publishing publishes documents to clean URLs (/d/:slug). Public visitors
                can inspect spreadsheets, PDFs, videos, and source code without creating accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 text-xs text-neutral-500 font-mono">
          <div>
            <span>OmniSpace Platform</span>
            <span className="mx-2">·</span>
            <span>FastAPI &amp; Strawberry GraphQL Core</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenGraphQLModal} className="hover:text-neutral-300">
              GraphQL API Spec
            </button>
            <span>·</span>
            <button onClick={onEnterApp} className="hover:text-neutral-300">
              Workspace Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
