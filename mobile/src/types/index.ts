export type SignIn = {
  email: string;
  password: string;
};

export type SignUp = {
  email: string;
  password: string;
  username: string;
};

export type User = {
  id: string;
  username: string | null;
  email: string;
  avatar_url: string | null;
  total_books: number;
};

export type Book = {
  id: number;
  title?: string;
  author?: string;
  rating?: number;
  comment_section?: string;
  started_at?: Date;
  finished_at?: Date;
  photo_url?: string;
  original_language?: string;
  publisher?: string;
  year_published?: Date;
  user?: {
    id: string;
    total_books: number;
  };
  memorable_quotes?: {
    id: number;
    content: string;
    book_id: number;
  }[];
};

export interface AuthError {
  message: string;
  status?: number;
}

export interface SupabaseAuthError {
  message: string;
  status?: number;
  code?: string;
}