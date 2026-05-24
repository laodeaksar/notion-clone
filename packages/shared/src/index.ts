export type UUID = string;

export interface User {
  id: UUID;
  email: string;
  name?: string;
}

export interface Page {
  id: UUID;
  title: string;
  parentId?: UUID | null;
  createdAt: string;
  updatedAt: string;
  content?: any;
}

export interface Block {
  id: UUID;
  pageId: UUID;
  type: string;
  content: any;
  order: number;
}
