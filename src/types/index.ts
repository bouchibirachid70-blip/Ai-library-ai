// Aivora – shared types
// All shapes mirror the database schema. Validation lives server-side in
// api/_lib/validation.js; these types describe the wire shape we trust.

export type Pricing = 'Free' | 'Freemium' | 'Paid' | 'Contact';
export type ToolStatus = 'pending' | 'approved' | 'rejected';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  created_at: string;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  website_url: string;
  category_id: string | null;
  pricing: Pricing;
  logo_url: string | null;
  rating: number;
  clicks_count: number;
  status: ToolStatus;
  featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined relation when fetched via ?with=category
  category?: Pick<Category, 'id' | 'name' | 'slug' | 'icon'> | null;
}

export interface Submission {
  id: string;
  tool_name: string;
  website_url: string;
  description: string;
  submitter_email: string;
  category_id: string | null;
  status: SubmissionStatus;
  notes: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author: string;
  published: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Click {
  id: string;
  tool_id: string;
  clicked_at: string;
  referrer: string | null;
  ip_hash: string | null;
}

export interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Metrics {
  total_tools: number;
  approved_tools: number;
  pending_tools: number;
  rejected_tools: number;
  total_categories: number;
  total_articles: number;
  published_articles: number;
  total_submissions: number;
  pending_submissions: number;
  total_clicks: number;
  recent_clicks: number;
  top_tools: Array<{ id: string; name: string; slug: string; clicks_count: number }>;
}

export type ApiError = {
  error: string;
  details?: unknown;
};

// Ad slot: admin-authored ad code (AdSense/JS snippet) attached to a
// free-text "position" key. The frontend renders whatever active slots
// match the position an <AdSlot /> asks for — see src/components/AdSlot.tsx.
export interface AdSlot {
  id: string;
  position: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}
