# OmniSpace — Full-Stack Content, Workspace & Project Management Platform

OmniSpace is a high-performance, full-stack management platform engineered with **FastAPI**, **SQLModel**, **SQLite / PostgreSQL**, **Strawberry GraphQL**, **JWT Authentication**, **Vite**, **React**, **TypeScript**, and **Tailwind CSS**.

It provides a hierarchical **Workspace → Project → Content** data model, fine-grained ownership-based access control, file upload & storage pipelines, rich interactive viewers for documents, code, media, and spreadsheets, as well as seamless one-click publishing with public unauthenticated links (`/d/:slug`).

---

## 🌟 Key Features

1. **Authentication & Ownership Security**:
   - Secure Registration and Login with bcrypt password hashing and JWT Bearer token authentication.
   - Ownership-based access: users can only manage their own workspaces, projects, and contents.
   - Published contents and projects can be made publicly accessible without authentication.

2. **Hierarchical Content Model**:
   - **Workspace**: Top-level organization container.
   - **Project**: Goal-oriented sub-containers within a workspace.
   - **Content**: Multi-format records supporting rich text, markdown, code, and uploaded files.

3. **Multi-Format Viewers & Editors**:
   - 📝 **Markdown Editor + Split Preview**: Real-time rendering with bold, code blocks, lists, quotes, and tables.
   - 💻 **Code / Text Editor**: Syntax highlighting, line numbers, language indicators, and instant copy.
   - 📊 **Excel Spreadsheet Viewer**: Parses `.xlsx` and `.xls` files, multi-sheet tabs, column letters, row numbers, search, and cell inspection.
   - 📄 **Word Document Viewer**: Parses `.docx` files into clean typography, headings, tables, and formatted text.
   - 📑 **PDF Viewer**: Document page navigation, zoom controls (50%–200%), thumbnail drawer, and full-screen reading.
   - 🖼️ **Image Viewer**: High-fidelity image canvas with zoom, pan, rotate, and aspect ratio details.
   - 🎬 **Video Player**: Media player with scrub timeline, custom playback speeds (0.5x, 1x, 1.25x, 1.5x, 2x), and picture-in-picture.

4. **Public Shareable URLs (`/d/:slug`)**:
   - One-click publishing generates a clean slug URL (`/d/:slug`).
   - Public pages require zero authentication and provide a fast, distraction-free viewer with download capabilities.

5. **Dual API Architecture (REST + Strawberry GraphQL)**:
   - Full RESTful API with automated OpenAPI / Swagger docs at `/docs`.
   - Complete Strawberry GraphQL endpoint at `/graphql` with interactive GraphiQL explorer.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.10+) | Asynchronous, type-hinted REST framework |
| **ORM / Data Layer** | SQLModel | Pydantic + SQLAlchemy unified model definitions |
| **GraphQL Engine** | Strawberry GraphQL | Pythonic GraphQL schemas leveraging Python type annotations |
| **Database** | SQLite / PostgreSQL | SQLite by default (`sqlite:///./omnispace.db`), drop-in PostgreSQL support |
| **Authentication** | JWT (HS256) + Passlib (bcrypt) | Stateless token auth with Bearer headers |
| **Frontend Framework** | React 19 + TypeScript | Modular functional components with hooks |
| **Build & Dev Tool** | Vite 8 + Tailwind CSS v4 | Ultra-fast HMR and utility-first responsive styling |
| **Parsers & Engines** | SheetJS (XLSX), Mammoth (.docx) | Client-side and server-side document parsing |

---

## 🚀 Quick Start (Local Setup)

### Option 1: Running with Docker Compose (Recommended)

To start the FastAPI backend and frontend simultaneously:

```bash
docker-compose up --build
```

- Frontend UI: `http://localhost:3000`
- FastAPI REST & GraphQL: `http://localhost:8000`
- GraphQL Playground: `http://localhost:8000/graphql`
- Interactive Swagger API Docs: `http://localhost:8000/docs`

---

### Option 2: Running Manually

#### 1. Backend (FastAPI + SQLModel + Strawberry)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run FastAPI backend with Uvicorn:
uvicorn main:app --reload --port 8000
```

#### 2. Frontend (Vite + React)

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

---

## 🗄️ Database Configuration (SQLite ↔ PostgreSQL)

OmniSpace defaults to SQLite with zero configuration required. The database file `omnispace.db` will be automatically generated upon first launch.

### Switching to PostgreSQL

To switch to PostgreSQL, simply change the `DATABASE_URL` environment variable:

```bash
# SQLite (Default)
DATABASE_URL="sqlite:///./omnispace.db"

# PostgreSQL (Production)
DATABASE_URL="postgresql://username:password@localhost:5432/omnispace"
```

In `docker-compose.yml`, uncomment the `postgres` service and the PostgreSQL `DATABASE_URL` environment line. SQLModel handles migrations and table creation automatically via `init_db()`.

---

## 🍓 Strawberry GraphQL API Examples

The GraphQL endpoint is available at `/graphql`.

### 1. User Registration Mutation
```graphql
mutation RegisterUser {
  register(
    email: "sarah@example.com"
    username: "sarah_dev"
    password: "StrongPassword123!"
    fullName: "Sarah Connor"
  ) {
    token
    user {
      id
      email
      username
      fullName
    }
  }
}
```

### 2. User Login Mutation
```graphql
mutation LoginUser {
  login(
    email: "sarah@example.com"
    password: "StrongPassword123!"
  ) {
    token
    user {
      id
      email
      username
    }
  }
}
```

### 3. Fetch Authenticated User (`me`)
*Include Header: `Authorization: Bearer <TOKEN>`*
```graphql
query GetCurrentUser {
  me {
    id
    email
    username
    fullName
    createdAt
  }
}
```

### 4. Fetch Workspaces and Nested Projects
```graphql
query ListUserWorkspaces {
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
}
```

### 5. Create a Workspace
```graphql
mutation CreateNewWorkspace {
  createWorkspace(
    name: "Engineering Core"
    description: "System architecture, API specifications and whitepapers"
  ) {
    id
    name
    slug
  }
}
```

### 6. Publish Content
```graphql
mutation TogglePublish {
  publishContent(id: 1, isPublished: true) {
    id
    title
    slug
    isPublished
  }
}
```

### 7. Fetch Public Shareable Content (No Authentication Required!)
```graphql
query GetPublicContent {
  publicContent(slug: "system-architecture-overview-928ab1") {
    id
    title
    slug
    contentType
    bodyText
    fileUrl
    fileName
    isPublished
  }
}
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Login and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/workspaces` | List current user's workspaces | Yes |
| `POST` | `/api/workspaces` | Create a workspace | Yes |
| `GET` | `/api/workspaces/:id`| Get workspace with projects | Yes |
| `PUT` | `/api/workspaces/:id`| Update workspace metadata | Yes |
| `DELETE`| `/api/workspaces/:id`| Delete workspace & cascade | Yes |
| `GET` | `/api/projects` | List projects (optional filter by workspace) | Yes |
| `POST` | `/api/projects` | Create a project | Yes |
| `PUT` | `/api/projects/:id` | Update project or toggle publish | Yes |
| `DELETE`| `/api/projects/:id` | Delete project | Yes |
| `GET` | `/api/contents` | List contents by project | Yes |
| `POST` | `/api/contents` | Create Markdown / Code / Text content | Yes |
| `POST` | `/api/contents/upload` | Multipart file upload (PDF, Video, Excel, Word, etc.) | Yes |
| `GET` | `/api/contents/:id` | Get content details | Yes |
| `PUT` | `/api/contents/:id` | Update content or publish toggle | Yes |
| `DELETE`| `/api/contents/:id`| Delete content & remove file from disk | Yes |
| `GET` | `/api/contents/:id/download` | Download attached content file | Yes |
| `GET` | `/api/public/content/:slug` | Fetch published content by slug | **No** |
| `GET` | `/api/public/showcase` | List published showcase content | **No** |
| `GET` | `/api/public/download/:slug`| Download published file | **No** |
