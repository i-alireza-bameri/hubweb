export type ContentType = 
  | 'markdown' 
  | 'code' 
  | 'text' 
  | 'image' 
  | 'pdf' 
  | 'video' 
  | 'word' 
  | 'excel';

export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  created_at?: string;
}

export interface Workspace {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  description: string;
  projects_count?: number;
  projects?: Project[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  workspace_id: number;
  name: string;
  slug: string;
  description: string;
  is_published: boolean;
  contents_count?: number;
  contents?: ContentItem[];
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: number;
  project_id: number;
  title: string;
  slug: string;
  content_type: ContentType;
  body_text?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  project?: {
    id?: number;
    name: string;
    slug?: string;
  };
  workspace?: {
    id?: number;
    name: string;
  };
}

export interface ShowcaseItem {
  id: number;
  title: string;
  slug: string;
  content_type: ContentType;
  file_name?: string;
  file_size?: number;
  created_at: string;
  project_name?: string;
  workspace_name?: string;
}
