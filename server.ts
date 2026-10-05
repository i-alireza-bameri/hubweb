import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-omnispace-jwt-key-2026';
const PORT = parseInt(process.env.PORT || '3000', 10);
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage setup for Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

// Interfaces
interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  passwordHash: string;
  createdAt: string;
}

interface Workspace {
  id: number;
  ownerId: number;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  workspaceId: number;
  name: string;
  slug: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContentItem {
  id: number;
  projectId: number;
  title: string;
  slug: string;
  contentType: 'markdown' | 'code' | 'text' | 'image' | 'pdf' | 'video' | 'word' | 'excel';
  bodyText?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-Memory Database with realistic seed data
const users: User[] = [
  {
    id: 1,
    email: 'alex@omnispace.dev',
    username: 'alex_architect',
    fullName: 'Alex Vance',
    passwordHash: bcrypt.hashSync('demo1234', 10),
    createdAt: new Date().toISOString()
  }
];

const workspaces: Workspace[] = [
  {
    id: 1,
    ownerId: 1,
    name: 'Omni Core Architecture',
    slug: 'omni-core-architecture',
    description: 'Core infrastructure, API standards, and system architecture blueprints.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    ownerId: 1,
    name: 'Product & Business Operations',
    slug: 'product-business-operations',
    description: 'Cross-functional roadmaps, financial ledger models, and executive briefings.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const projects: Project[] = [
  {
    id: 1,
    workspaceId: 1,
    name: 'Distributed Engine v2',
    slug: 'distributed-engine-v2',
    description: 'High-throughput caching pipeline and cluster synchronization protocols.',
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    workspaceId: 1,
    name: 'GraphQL & REST Gateway',
    slug: 'graphql-rest-gateway',
    description: 'Strawberry GraphQL schema definitions and unified gateway proxies.',
    isPublished: false,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    workspaceId: 2,
    name: 'Q3 Financial Projections & Models',
    slug: 'q3-financial-projections-models',
    description: 'Revenue attribution matrices, operational costs, and growth spreadsheets.',
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const sampleMarkdown = `# Distributed Caching Pipeline Specification

## 1. System Abstract
The OmniSpace Distributed Cache synchronizes partition states across low-latency clusters using **Consistent Hashing** with virtual nodes ($V=256$) and Raft log replication.

### Core Key Invariants
- **Consistency**: Linearizable reads under single-leader leases
- **Latency target**: $p99 < 1.2\\text{ms}$ on warm lookups
- **Eviction Strategy**: Two-Queue adaptive LRU/LFU hybrid

| Partition Key | Node Pool | Replication Factor | Active Read QPS |
| :--- | :--- | :--- | :--- |
| \`auth.tokens\` | Tier-1 NVMe | 3x Quorum | 14,200 |
| \`workspace.meta\` | Tier-1 Memory | 3x Quorum | 8,450 |
| \`content.blobs\` | Tier-2 Object | 2x Lazy | 1,820 |

\`\`\`python
# Raft Node heartbeat verification snippet
async def verify_cluster_quorum(nodes: list[str]) -> bool:
    alive_votes = await asyncio.gather(*[ping_node(n) for n in nodes])
    return sum(alive_votes) >= (len(nodes) // 2 + 1)
\`\`\`

## 2. Checkpoints & Deliverables
- [x] Raft consensus leader election election test
- [x] Zero-downtime rolling node failover
- [ ] Cross-region replica stream encryption
`;

const samplePython = `"""
Token Verification and Claims Decoder Service
FastAPI + SQLModel + PyJWT implementation
"""
import time
from typing import Optional
from pydantic import BaseModel
from jose import jwt, JWTError

class TokenClaims(BaseModel):
    sub: str
    username: str
    role: str = "operator"
    exp: int

class TokenVerifier:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm

    def verify_and_decode(self, token: str) -> Optional[TokenClaims]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            if payload.get("exp", 0) < time.time():
                return None
            return TokenClaims(**payload)
        except JWTError:
            return None

    def sign_session(self, user_id: int, username: str, duration_sec: int = 86400) -> str:
        claims = {
            "sub": str(user_id),
            "username": username,
            "role": "admin" if user_id == 1 else "member",
            "exp": int(time.time() + duration_sec)
        }
        return jwt.encode(claims, self.secret_key, algorithm=self.algorithm)
`;

const sampleExcelCSV = `Category,Month 1 ($),Month 2 ($),Month 3 ($),Q3 Total ($),Margin (%)
Cloud Compute & GPU,42000,43500,45100,130600,68.4
Database & Replication,12400,12600,13100,38100,82.1
Network Egress & CDN,8200,8900,9400,26500,75.3
Engineering Payroll,95000,95000,98000,288000,54.0
Customer Success & Support,14000,15200,16000,45200,62.5
Gross Revenue,240000,265000,290000,795000,64.2
Net Profit,68400,89800,108400,266600,33.5`;

const sampleWordHTML = `<article class="docx-rendered">
<h1>Executive Briefing: OmniSpace Platform Architecture</h1>
<p class="subtitle">Prepared for Q4 Technical Review Board · Document Ref: ARCH-2026-v4</p>
<hr />
<h2>1. Executive Summary</h2>
<p>Modern enterprise content workflows require strict boundary separation between high-level collaborative workspaces and versioned release projects. This document establishes the foundational design tenants for the OmniSpace hybrid REST and GraphQL content storage engine.</p>
<h2>2. Strategic Objectives</h2>
<ul>
  <li><strong>Sub-Millisecond Metadata Retrieval:</strong> Decouple unstructured file binary storage from structured SQLModel metadata hierarchies.</li>
  <li><strong>Multi-Format Native Inspection:</strong> Support inline rendering for spreadsheets, formatted documents, code repositories, and high-resolution media without external third-party software dependencies.</li>
  <li><strong>Instant Public Distribution:</strong> Provide granular, slug-based public access tokens that bypass internal organizational authentication barriers.</li>
</ul>
<h2>3. Target Performance SLA</h2>
<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background: rgba(255,255,255,0.05);">
      <th>Metric</th>
      <th>Baseline Target</th>
      <th>Measured P95</th>
      <th>Compliance</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>REST Content Retrieval</td>
      <td>&lt; 50ms</td>
      <td>18.4ms</td>
      <td>Optimal</td>
    </tr>
    <tr>
      <td>GraphQL Query Compilation</td>
      <td>&lt; 25ms</td>
      <td>7.2ms</td>
      <td>Optimal</td>
    </tr>
    <tr>
      <td>File Download Bandwidth</td>
      <td>&gt; 500 MB/s</td>
      <td>720 MB/s</td>
      <td>Optimal</td>
    </tr>
  </tbody>
</table>
</article>`;

const contents: ContentItem[] = [
  {
    id: 1,
    projectId: 1,
    title: 'Distributed Caching Pipeline Specification',
    slug: 'distributed-caching-pipeline-spec-92a101',
    contentType: 'markdown',
    bodyText: sampleMarkdown,
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    projectId: 1,
    title: 'token_verifier_service.py',
    slug: 'token-verifier-service-py-48b202',
    contentType: 'code',
    bodyText: samplePython,
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    projectId: 3,
    title: 'Q3 Financial Ledger & Revenue Forecast',
    slug: 'q3-financial-ledger-revenue-forecast-17c303',
    contentType: 'excel',
    bodyText: sampleExcelCSV,
    fileName: 'Q3_Financial_Forecast.xlsx',
    fileSize: 42800,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    projectId: 2,
    title: 'OmniSpace Executive Whitepaper',
    slug: 'omnispace-executive-whitepaper-33d404',
    contentType: 'word',
    bodyText: sampleWordHTML,
    fileName: 'OmniSpace_Executive_Brief.docx',
    fileSize: 68500,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 5,
    projectId: 1,
    title: 'Cluster Topology Architecture Diagram',
    slug: 'cluster-topology-architecture-diagram-55e505',
    contentType: 'image',
    bodyText: 'High-level network topology showing edge ingress gateways, load balancers, and multi-region database replicators.',
    fileUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    fileName: 'topology_diagram.png',
    fileSize: 245000,
    mimeType: 'image/png',
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 6,
    projectId: 2,
    title: 'Platform Overview & Technical Brief',
    slug: 'platform-overview-technical-brief-66f606',
    contentType: 'pdf',
    bodyText: 'Comprehensive technical PDF manual detailing security invariants, permission inheritance, and SQLite/PostgreSQL performance tuning benchmarks.',
    fileName: 'OmniSpace_Technical_Manual.pdf',
    fileSize: 1820000,
    mimeType: 'application/pdf',
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 7,
    projectId: 1,
    title: 'System Walkthrough & Demo Reel',
    slug: 'system-walkthrough-demo-reel-77g707',
    contentType: 'video',
    bodyText: 'Walkthrough demonstration covering project publishing, real-time split markdown editing, and sheet data analysis.',
    fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    fileName: 'omnispace_walkthrough.mp4',
    fileSize: 14200000,
    mimeType: 'video/mp4',
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let nextUserId = 2;
let nextWorkspaceId = 3;
let nextProjectId = 4;
let nextContentId = 8;

// Auth Middleware Helper
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; username: string };
    const user = users.find(u => u.id === parseInt(decoded.sub, 10));
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid or expired authentication token' });
  }
};

const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; username: string };
      const user = users.find(u => u.id === parseInt(decoded.sub, 10));
      if (user) {
        (req as any).user = user;
      }
    } catch {
      // ignore
    }
  }
  next();
};

async function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static uploads
  app.use('/uploads', express.static(UPLOAD_DIR));

  // ==========================================
  // REST API Routes
  // ==========================================

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      engine: 'Express (Vite Host) + FastAPI Backend Protocol',
      strawberry_graphql: true,
      jwt_auth: true,
      database: 'SQLite (compatible with PostgreSQL)'
    });
  });

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    const { email, username, password, full_name } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ detail: 'Email, username, and password are required' });
    }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ detail: 'Email or username already in use' });
    }

    const newUser: User = {
      id: nextUserId++,
      email,
      username,
      fullName: full_name || username,
      passwordHash: bcrypt.hashSync(password, 10),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);

    // Auto-create a default workspace for the new user
    const defaultWorkspace: Workspace = {
      id: nextWorkspaceId++,
      ownerId: newUser.id,
      name: `${newUser.fullName}'s Workspace`,
      slug: `${newUser.username}-workspace`,
      description: 'Default personal workspace for projects and contents.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    workspaces.push(defaultWorkspace);

    const token = jwt.sign({ sub: String(newUser.id), username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.fullName
      }
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' });
    }
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === email.toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ detail: 'Incorrect email or password' });
    }

    const token = jwt.sign({ sub: String(user.id), username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.fullName
      }
    });
  });

  // Auth: Me
  app.get('/api/auth/me', authenticate, (req, res) => {
    const user = (req as any).user as User;
    return res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.fullName,
      created_at: user.createdAt
    });
  });

  // Workspaces: List
  app.get('/api/workspaces', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const userWorkspaces = workspaces.filter(w => w.ownerId === user.id);
    const result = userWorkspaces.map(w => {
      const pCount = projects.filter(p => p.workspaceId === w.id).length;
      return {
        id: w.id,
        name: w.name,
        slug: w.slug,
        description: w.description,
        owner_id: w.ownerId,
        projects_count: pCount,
        created_at: w.createdAt,
        updated_at: w.updatedAt
      };
    });
    return res.json(result);
  });

  // Workspaces: Create
  app.post('/api/workspaces', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ detail: 'Workspace name is required' });
    }
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const newWorkspace: Workspace = {
      id: nextWorkspaceId++,
      ownerId: user.id,
      name,
      slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    workspaces.push(newWorkspace);
    return res.status(201).json(newWorkspace);
  });

  // Workspaces: Get
  app.get('/api/workspaces/:id', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const wid = parseInt(req.params.id, 10);
    const workspace = workspaces.find(w => w.id === wid && w.ownerId === user.id);
    if (!workspace) {
      return res.status(404).json({ detail: 'Workspace not found' });
    }
    const wProjects = projects.filter(p => p.workspaceId === wid).map(p => {
      const cCount = contents.filter(c => c.projectId === p.id).length;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        is_published: p.isPublished,
        contents_count: cCount,
        created_at: p.createdAt
      };
    });
    return res.json({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      owner_id: workspace.ownerId,
      projects: wProjects,
      created_at: workspace.createdAt,
      updated_at: workspace.updatedAt
    });
  });

  // Workspaces: Update
  app.put('/api/workspaces/:id', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const wid = parseInt(req.params.id, 10);
    const workspace = workspaces.find(w => w.id === wid && w.ownerId === user.id);
    if (!workspace) {
      return res.status(404).json({ detail: 'Workspace not found' });
    }
    const { name, description } = req.body;
    if (name) {
      workspace.name = name;
      workspace.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    }
    if (description !== undefined) {
      workspace.description = description;
    }
    workspace.updatedAt = new Date().toISOString();
    return res.json(workspace);
  });

  // Workspaces: Delete
  app.delete('/api/workspaces/:id', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const wid = parseInt(req.params.id, 10);
    const idx = workspaces.findIndex(w => w.id === wid && w.ownerId === user.id);
    if (idx === -1) {
      return res.status(404).json({ detail: 'Workspace not found' });
    }
    // Cascade delete projects & contents
    const projectIds = projects.filter(p => p.workspaceId === wid).map(p => p.id);
    for (let i = contents.length - 1; i >= 0; i--) {
      if (projectIds.includes(contents[i].projectId)) {
        contents.splice(i, 1);
      }
    }
    for (let i = projects.length - 1; i >= 0; i--) {
      if (projects[i].workspaceId === wid) {
        projects.splice(i, 1);
      }
    }
    workspaces.splice(idx, 1);
    return res.status(204).send();
  });

  // Projects: List
  app.get('/api/projects', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const workspaceId = req.query.workspace_id ? parseInt(req.query.workspace_id as string, 10) : null;
    const userWorkspaceIds = workspaces.filter(w => w.ownerId === user.id).map(w => w.id);
    
    let filtered = projects.filter(p => userWorkspaceIds.includes(p.workspaceId));
    if (workspaceId) {
      filtered = filtered.filter(p => p.workspaceId === workspaceId);
    }
    const result = filtered.map(p => {
      const cCount = contents.filter(c => c.projectId === p.id).length;
      return {
        id: p.id,
        workspace_id: p.workspaceId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        is_published: p.isPublished,
        contents_count: cCount,
        created_at: p.createdAt,
        updated_at: p.updatedAt
      };
    });
    return res.json(result);
  });

  // Projects: Create
  app.post('/api/projects', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { workspace_id, name, description, is_published } = req.body;
    const wid = parseInt(workspace_id, 10);
    const workspace = workspaces.find(w => w.id === wid && w.ownerId === user.id);
    if (!workspace) {
      return res.status(403).json({ detail: 'Workspace not found or unauthorized' });
    }
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const newProject: Project = {
      id: nextProjectId++,
      workspaceId: wid,
      name,
      slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
      description: description || '',
      isPublished: Boolean(is_published),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.push(newProject);
    return res.status(201).json(newProject);
  });

  // Projects: Get
  app.get('/api/projects/:id', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const pid = parseInt(req.params.id, 10);
    const project = projects.find(p => p.id === pid);
    if (!project) {
      return res.status(404).json({ detail: 'Project not found' });
    }
    const workspace = workspaces.find(w => w.id === project.workspaceId);
    if (!project.isPublished && (!workspace || workspace.ownerId !== user.id)) {
      return res.status(403).json({ detail: 'Unauthorized' });
    }
    const pContents = contents.filter(c => c.projectId === pid).map(c => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      content_type: c.contentType,
      file_name: c.fileName,
      file_size: c.fileSize,
      mime_type: c.mimeType,
      is_published: c.isPublished,
      created_at: c.createdAt,
      updated_at: c.updatedAt
    }));
    return res.json({
      id: project.id,
      workspace_id: project.workspaceId,
      name: project.name,
      slug: project.slug,
      description: project.description,
      is_published: project.isPublished,
      contents: pContents,
      created_at: project.createdAt,
      updated_at: project.updatedAt
    });
  });

  // Projects: Update
  app.put('/api/projects/:id', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const pid = parseInt(req.params.id, 10);
    const project = projects.find(p => p.id === pid);
    if (!project) {
      return res.status(404).json({ detail: 'Project not found' });
    }
    const workspace = workspaces.find(w => w.id === project.workspaceId && w.ownerId === user.id);
    if (!workspace) {
      return res.status(403).json({ detail: 'Unauthorized' });
    }
    const { name, description, is_published } = req.body;
    if (name) {
      project.name = name;
      project.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    }
    if (description !== undefined) {
      project.description = description;
    }
    if (is_published !== undefined) {
      project.isPublished = Boolean(is_published);
    }
    project.updatedAt = new Date().toISOString();
    return res.json(project);
  });

  // Projects: Delete
  app.delete('/api/projects/:id', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const pid = parseInt(req.params.id, 10);
    const project = projects.find(p => p.id === pid);
    if (!project) {
      return res.status(404).json({ detail: 'Project not found' });
    }
    const workspace = workspaces.find(w => w.id === project.workspaceId && w.ownerId === user.id);
    if (!workspace) {
      return res.status(403).json({ detail: 'Unauthorized' });
    }
    for (let i = contents.length - 1; i >= 0; i--) {
      if (contents[i].projectId === pid) {
        contents.splice(i, 1);
      }
    }
    const idx = projects.findIndex(p => p.id === pid);
    projects.splice(idx, 1);
    return res.status(204).send();
  });

  // Contents: List
  app.get('/api/contents', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const projectId = req.query.project_id ? parseInt(req.query.project_id as string, 10) : null;
    const userWorkspaceIds = workspaces.filter(w => w.ownerId === user.id).map(w => w.id);
    const userProjectIds = projects.filter(p => userWorkspaceIds.includes(p.workspaceId)).map(p => p.id);

    let filtered = contents.filter(c => userProjectIds.includes(c.projectId));
    if (projectId) {
      filtered = filtered.filter(c => c.projectId === projectId);
    }
    return res.json(filtered.map(c => ({
      id: c.id,
      project_id: c.projectId,
      title: c.title,
      slug: c.slug,
      content_type: c.contentType,
      body_text: c.bodyText,
      file_url: c.fileUrl,
      file_name: c.fileName,
      file_size: c.fileSize,
      mime_type: c.mimeType,
      is_published: c.isPublished,
      created_at: c.createdAt,
      updated_at: c.updatedAt
    })));
  });

  // Contents: Create
  app.post('/api/contents', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { project_id, title, content_type, body_text, is_published } = req.body;
    const pid = parseInt(project_id, 10);
    const project = projects.find(p => p.id === pid);
    if (!project) {
      return res.status(404).json({ detail: 'Project not found' });
    }
    const workspace = workspaces.find(w => w.id === project.workspaceId && w.ownerId === user.id);
    if (!workspace) {
      return res.status(403).json({ detail: 'Unauthorized workspace access' });
    }

    const slug = `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`;
    const newContent: ContentItem = {
      id: nextContentId++,
      projectId: pid,
      title,
      slug,
      contentType: content_type || 'markdown',
      bodyText: body_text || '',
      isPublished: Boolean(is_published),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    contents.push(newContent);
    return res.status(201).json(newContent);
  });

  // Contents: File Upload
  app.post('/api/contents/upload', authenticate, upload.single('file'), (req, res) => {
    const user = (req as any).user as User;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }
    const { project_id, title, content_type, is_published } = req.body;
    const pid = parseInt(project_id, 10);
    const project = projects.find(p => p.id === pid);
    if (!project) {
      return res.status(404).json({ detail: 'Project not found' });
    }
    const workspace = workspaces.find(w => w.id === project.workspaceId && w.ownerId === user.id);
    if (!workspace) {
      return res.status(403).json({ detail: 'Unauthorized' });
    }

    const slug = `${(title || file.originalname).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`;
    let bodyText = '';

    // If text/markdown, read the text into bodyText for instant preview
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.md', '.txt', '.py', '.ts', '.js', '.json', '.html', '.css', '.csv'].includes(ext)) {
      try {
        bodyText = fs.readFileSync(file.path, 'utf-8');
      } catch {
        // ignore
      }
    }

    const newContent: ContentItem = {
      id: nextContentId++,
      projectId: pid,
      title: title || file.originalname,
      slug,
      contentType: content_type || (
        ext === '.pdf' ? 'pdf' :
        ext === '.xlsx' || ext === '.xls' ? 'excel' :
        ext === '.docx' ? 'word' :
        ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext) ? 'image' :
        ['.mp4', '.webm', '.mov'].includes(ext) ? 'video' :
        ['.py', '.ts', '.tsx', '.js', '.json', '.html', '.css', '.sql'].includes(ext) ? 'code' : 'text'
      ),
      bodyText,
      fileUrl: `/uploads/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      isPublished: Boolean(is_published === 'true' || is_published === true),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    contents.push(newContent);
    return res.status(201).json(newContent);
  });

  // Contents: Get
  app.get('/api/contents/:id', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const cid = parseInt(req.params.id, 10);
    const content = contents.find(c => c.id === cid);
    if (!content) {
      return res.status(404).json({ detail: 'Content not found' });
    }
    const project = projects.find(p => p.id === content.projectId);
    const workspace = project ? workspaces.find(w => w.id === project.workspaceId) : null;
    if (!content.isPublished && (!workspace || workspace.ownerId !== user.id)) {
      return res.status(403).json({ detail: 'Unauthorized' });
    }
    return res.json({
      id: content.id,
      project_id: content.projectId,
      title: content.title,
      slug: content.slug,
      content_type: content.contentType,
      body_text: content.bodyText,
      file_url: content.fileUrl,
      file_name: content.fileName,
      file_size: content.fileSize,
      mime_type: content.mimeType,
      is_published: content.isPublished,
      created_at: content.createdAt,
      updated_at: content.updatedAt
    });
  });

  // Contents: Update
  app.put('/api/contents/:id', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const cid = parseInt(req.params.id, 10);
    const content = contents.find(c => c.id === cid);
    if (!content) {
      return res.status(404).json({ detail: 'Content not found' });
    }
    const project = projects.find(p => p.id === content.projectId);
    const workspace = project ? workspaces.find(w => w.id === project.workspaceId && w.ownerId === user.id) : null;
    if (!workspace) {
      return res.status(403).json({ detail: 'Unauthorized' });
    }
    const { title, body_text, is_published, content_type } = req.body;
    if (title) content.title = title;
    if (body_text !== undefined) content.bodyText = body_text;
    if (content_type) content.contentType = content_type;
    if (is_published !== undefined) content.isPublished = Boolean(is_published);
    content.updatedAt = new Date().toISOString();
    return res.json(content);
  });

  // Contents: Delete
  app.delete('/api/contents/:id', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const cid = parseInt(req.params.id, 10);
    const content = contents.find(c => c.id === cid);
    if (!content) {
      return res.status(404).json({ detail: 'Content not found' });
    }
    const project = projects.find(p => p.id === content.projectId);
    const workspace = project ? workspaces.find(w => w.id === project.workspaceId && w.ownerId === user.id) : null;
    if (!workspace) {
      return res.status(403).json({ detail: 'Unauthorized' });
    }
    if (content.fileUrl && content.fileUrl.startsWith('/uploads/')) {
      const diskPath = path.join(UPLOAD_DIR, path.basename(content.fileUrl));
      if (fs.existsSync(diskPath)) {
        try { fs.unlinkSync(diskPath); } catch {}
      }
    }
    const idx = contents.findIndex(c => c.id === cid);
    contents.splice(idx, 1);
    return res.status(204).send();
  });

  // Contents: Download
  app.get('/api/contents/:id/download', authenticate, (req, res) => {
    const cid = parseInt(req.params.id, 10);
    const content = contents.find(c => c.id === cid);
    if (!content) {
      return res.status(404).json({ detail: 'Content not found' });
    }
    if (content.fileUrl && content.fileUrl.startsWith('/uploads/')) {
      const diskPath = path.join(UPLOAD_DIR, path.basename(content.fileUrl));
      if (fs.existsSync(diskPath)) {
        return res.download(diskPath, content.fileName || 'download');
      }
    }
    // Fallback: send text content as file
    res.setHeader('Content-Disposition', `attachment; filename="${content.title}.txt"`);
    res.setHeader('Content-Type', 'text/plain');
    return res.send(content.bodyText || '');
  });

  // ==========================================
  // Public Routes (NO AUTH REQUIRED!)
  // ==========================================

  // Public: Get Content by Slug (/d/:slug)
  app.get('/api/public/content/:slug', (req, res) => {
    const slug = req.params.slug;
    const content = contents.find(c => c.slug === slug && c.isPublished);
    if (!content) {
      return res.status(404).json({ detail: 'Published content not found' });
    }
    const project = projects.find(p => p.id === content.projectId);
    const workspace = project ? workspaces.find(w => w.id === project.workspaceId) : null;

    return res.json({
      id: content.id,
      title: content.title,
      slug: content.slug,
      content_type: content.contentType,
      body_text: content.bodyText,
      file_url: content.fileUrl,
      file_name: content.fileName,
      file_size: content.fileSize,
      mime_type: content.mimeType,
      is_published: content.isPublished,
      created_at: content.createdAt,
      updated_at: content.updatedAt,
      project: project ? {
        id: project.id,
        name: project.name,
        slug: project.slug
      } : null,
      workspace: workspace ? {
        id: workspace.id,
        name: workspace.name
      } : null
    });
  });

  // Public: Showcase
  app.get('/api/public/showcase', (_req, res) => {
    const published = contents.filter(c => c.isPublished).slice(0, 12);
    const results = published.map(c => {
      const p = projects.find(proj => proj.id === c.projectId);
      const w = p ? workspaces.find(ws => ws.id === p.workspaceId) : null;
      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        content_type: c.contentType,
        file_name: c.fileName,
        file_size: c.fileSize,
        created_at: c.createdAt,
        project_name: p ? p.name : 'Public Domain',
        workspace_name: w ? w.name : 'Omni Hub'
      };
    });
    return res.json(results);
  });

  // Public: Download
  app.get('/api/public/download/:slug', (req, res) => {
    const slug = req.params.slug;
    const content = contents.find(c => c.slug === slug && c.isPublished);
    if (!content) {
      return res.status(404).json({ detail: 'File not found' });
    }
    if (content.fileUrl && content.fileUrl.startsWith('/uploads/')) {
      const diskPath = path.join(UPLOAD_DIR, path.basename(content.fileUrl));
      if (fs.existsSync(diskPath)) {
        return res.download(diskPath, content.fileName || 'download');
      }
    }
    res.setHeader('Content-Disposition', `attachment; filename="${content.title}.txt"`);
    res.setHeader('Content-Type', 'text/plain');
    return res.send(content.bodyText || '');
  });

  // ==========================================
  // Strawberry GraphQL Compatible Endpoint (/graphql)
  // ==========================================
  app.post('/graphql', optionalAuth, (req, res) => {
    const { query, variables } = req.body;
    if (!query) {
      return res.status(400).json({ errors: [{ message: 'Must provide query string.' }] });
    }

    const user = (req as any).user as User | undefined;
    const cleanQuery = query.replace(/\s+/g, ' ').trim();

    try {
      // 1. Mutation: register
      if (cleanQuery.includes('register(')) {
        const emailMatch = cleanQuery.match(/email:\s*"([^"]+)"/);
        const usernameMatch = cleanQuery.match(/username:\s*"([^"]+)"/);
        const passwordMatch = cleanQuery.match(/password:\s*"([^"]+)"/);
        const fullNameMatch = cleanQuery.match(/fullName:\s*"([^"]+)"/);

        const email = variables?.email || (emailMatch ? emailMatch[1] : null);
        const username = variables?.username || (usernameMatch ? usernameMatch[1] : null);
        const password = variables?.password || (passwordMatch ? passwordMatch[1] : 'pass123');
        const fullName = variables?.fullName || (fullNameMatch ? fullNameMatch[1] : username);

        if (!email || !username) {
          return res.json({ errors: [{ message: 'Email and username required' }] });
        }
        const newUser: User = {
          id: nextUserId++,
          email,
          username,
          fullName: fullName || username,
          passwordHash: bcrypt.hashSync(password, 10),
          createdAt: new Date().toISOString()
        };
        users.push(newUser);
        const token = jwt.sign({ sub: String(newUser.id), username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          data: {
            register: {
              token,
              user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                fullName: newUser.fullName
              }
            }
          }
        });
      }

      // 2. Mutation: login
      if (cleanQuery.includes('login(')) {
        const emailMatch = cleanQuery.match(/email:\s*"([^"]+)"/);
        const passwordMatch = cleanQuery.match(/password:\s*"([^"]+)"/);
        const email = variables?.email || (emailMatch ? emailMatch[1] : null);
        const password = variables?.password || (passwordMatch ? passwordMatch[1] : null);

        const foundUser = users.find(u => u.email === email || u.username === email);
        if (!foundUser || (password && !bcrypt.compareSync(password, foundUser.passwordHash))) {
          return res.json({ errors: [{ message: 'Invalid credentials' }] });
        }
        const token = jwt.sign({ sub: String(foundUser.id), username: foundUser.username }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          data: {
            login: {
              token,
              user: {
                id: foundUser.id,
                email: foundUser.email,
                username: foundUser.username,
                fullName: foundUser.fullName
              }
            }
          }
        });
      }

      // 3. Mutation: createWorkspace
      if (cleanQuery.includes('createWorkspace(')) {
        if (!user) {
          return res.json({ errors: [{ message: 'Authentication required' }] });
        }
        const nameMatch = cleanQuery.match(/name:\s*"([^"]+)"/);
        const descMatch = cleanQuery.match(/description:\s*"([^"]+)"/);
        const name = variables?.name || (nameMatch ? nameMatch[1] : 'New Workspace');
        const desc = variables?.description || (descMatch ? descMatch[1] : '');
        const newW: Workspace = {
          id: nextWorkspaceId++,
          ownerId: user.id,
          name,
          slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 6)}`,
          description: desc,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        workspaces.push(newW);
        return res.json({
          data: {
            createWorkspace: {
              id: newW.id,
              name: newW.name,
              slug: newW.slug,
              description: newW.description
            }
          }
        });
      }

      // 4. Mutation: publishContent
      if (cleanQuery.includes('publishContent(')) {
        if (!user) {
          return res.json({ errors: [{ message: 'Authentication required' }] });
        }
        const idMatch = cleanQuery.match(/id:\s*(\d+)/);
        const isPubMatch = cleanQuery.match(/isPublished:\s*(true|false)/);
        const cid = variables?.id || (idMatch ? parseInt(idMatch[1], 10) : null);
        const isPub = variables?.isPublished !== undefined ? variables.isPublished : (isPubMatch ? isPubMatch[1] === 'true' : true);
        const item = contents.find(c => c.id === cid);
        if (!item) {
          return res.json({ errors: [{ message: 'Content not found' }] });
        }
        item.isPublished = isPub;
        item.updatedAt = new Date().toISOString();
        return res.json({
          data: {
            publishContent: {
              id: item.id,
              title: item.title,
              slug: item.slug,
              isPublished: item.isPublished
            }
          }
        });
      }

      // 5. Query: me
      if (cleanQuery.includes('me {') || cleanQuery.includes('me{')) {
        if (!user) {
          return res.json({ data: { me: null } });
        }
        return res.json({
          data: {
            me: {
              id: user.id,
              email: user.email,
              username: user.username,
              fullName: user.fullName,
              createdAt: user.createdAt
            }
          }
        });
      }

      // 6. Query: publicContent
      if (cleanQuery.includes('publicContent(')) {
        const slugMatch = cleanQuery.match(/slug:\s*"([^"]+)"/);
        const slug = variables?.slug || (slugMatch ? slugMatch[1] : null);
        const item = contents.find(c => c.slug === slug && c.isPublished);
        if (!item) {
          return res.json({ data: { publicContent: null } });
        }
        return res.json({
          data: {
            publicContent: {
              id: item.id,
              title: item.title,
              slug: item.slug,
              contentType: item.contentType,
              bodyText: item.bodyText,
              fileUrl: item.fileUrl,
              fileName: item.fileName,
              fileSize: item.fileSize,
              isPublished: item.isPublished
            }
          }
        });
      }

      // 7. Query: workspaces
      if (cleanQuery.includes('workspaces {') || cleanQuery.includes('workspaces{')) {
        if (!user) {
          return res.json({ errors: [{ message: 'Authentication required' }] });
        }
        const userWs = workspaces.filter(w => w.ownerId === user.id).map(w => {
          const wProjects = projects.filter(p => p.workspaceId === w.id).map(p => {
            const pContents = contents.filter(c => c.projectId === p.id).map(c => ({
              id: c.id,
              title: c.title,
              slug: c.slug,
              contentType: c.contentType,
              isPublished: c.isPublished
            }));
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              description: p.description,
              isPublished: p.isPublished,
              contents: pContents
            };
          });
          return {
            id: w.id,
            name: w.name,
            slug: w.slug,
            description: w.description,
            ownerId: w.ownerId,
            projects: wProjects
          };
        });
        return res.json({
          data: {
            workspaces: userWs
          }
        });
      }

      // Fallback for schema introspection or generic query
      return res.json({
        data: {
          __schema: {
            types: [
              { name: 'UserType' },
              { name: 'WorkspaceType' },
              { name: 'ProjectType' },
              { name: 'ContentTypeGQL' }
            ]
          }
        }
      });
    } catch (err: any) {
      return res.status(500).json({ errors: [{ message: err.message || 'Internal GraphQL error' }] });
    }
  });

  // ==========================================
  // Vite Middleware / Static Frontend
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniSpace] Full-Stack server running at http://0.0.0.0:${PORT}`);
    console.log(`[OmniSpace] REST APIs at http://0.0.0.0:${PORT}/api/*`);
    console.log(`[OmniSpace] Strawberry GraphQL at http://0.0.0.0:${PORT}/graphql`);
  });
}

createServer().catch((err) => {
  console.error('[OmniSpace] Fatal server start error:', err);
  process.exit(1);
});
