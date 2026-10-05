import React, { useState } from 'react';
import { api } from '../../api/client';
import { X, Play, Terminal, Copy, Check, Sparkles } from 'lucide-react';

interface GraphQLExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_QUERIES = [
  {
    name: '1. Current User (me)',
    query: `query GetCurrentUser {
  me {
    id
    email
    username
    fullName
    createdAt
  }
}`,
  },
  {
    name: '2. Workspaces & Projects Hierarchy',
    query: `query ListWorkspacesWithProjects {
  workspaces {
    id
    name
    slug
    description
    projects {
      id
      name
      slug
      isPublished
      contents {
        id
        title
        slug
        contentType
        isPublished
      }
    }
  }
}`,
  },
  {
    name: '3. Create Workspace Mutation',
    query: `mutation CreateWorkspace {
  createWorkspace(
    name: "AI & ML Systems"
    description: "Model weights, evaluation metrics, and GPU workloads"
  ) {
    id
    name
    slug
    description
  }
}`,
  },
  {
    name: '4. Publish Content Mutation',
    query: `mutation PublishDocument {
  publishContent(
    id: 1
    isPublished: true
  ) {
    id
    title
    slug
    isPublished
  }
}`,
  },
  {
    name: '5. Public Content (Zero Auth Required)',
    query: `query GetPublicDocument {
  publicContent(
    slug: "distributed-caching-pipeline-spec-92a101"
  ) {
    id
    title
    slug
    contentType
    isPublished
  }
}`,
  },
];

export const GraphQLExplorerModal: React.FC<GraphQLExplorerModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState(PRESET_QUERIES[1].query);
  const [response, setResponse] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await api.executeGraphQL(query);
      setStatus(res.status);
      setLatency(res.latency);
      setResponse(res.data);
    } catch (err: any) {
      setResponse({ error: err.message || 'Execution error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col h-[90vh] w-full max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>Strawberry GraphQL Console</span>
                <span className="font-mono text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                  POST /graphql
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecute}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{loading ? 'Executing...' : 'Run Query'}</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-neutral-800 bg-neutral-900/40 px-4 py-2 text-xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mr-1">
            Presets:
          </span>
          {PRESET_QUERIES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(p.query)}
              className="whitespace-nowrap rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Editor & Response Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          {/* Query Editor */}
          <div className="flex flex-col border-r border-neutral-800 bg-neutral-950 p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-900 text-xs text-neutral-400">
              <span className="font-mono text-[11px]">GRAPHQL QUERY / MUTATION</span>
              <button
                onClick={handleCopyQuery}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="query { ... }"
              className="flex-1 resize-none bg-transparent font-mono text-xs leading-relaxed text-indigo-300 placeholder-neutral-600 focus:outline-none focus:ring-0"
              spellCheck="false"
            />
          </div>

          {/* Response Inspector */}
          <div className="flex flex-col bg-neutral-900/30 p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-xs text-neutral-400">
              <span className="font-mono text-[11px]">JSON RESPONSE</span>
              {status && (
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded ${status === 200 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                    HTTP {status}
                  </span>
                  {latency !== null && (
                    <span className="text-neutral-400 tabular-nums">{latency}ms</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto rounded-lg bg-neutral-950 p-4 border border-neutral-900">
              {loading ? (
                <div className="flex h-full items-center justify-center text-neutral-500 font-mono text-xs">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mr-2" />
                  Resolving Strawberry GraphQL fields...
                </div>
              ) : response ? (
                <pre className="font-mono text-xs leading-relaxed text-neutral-300 whitespace-pre-wrap">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-neutral-500 text-xs">
                  <p>Click "Run Query" above to execute query against the backend.</p>
                  <p className="mt-1 text-[11px] text-neutral-600">
                    Bearer token is attached automatically if signed in.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
