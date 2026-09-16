// Domain constants shared by client and server.

export const PRICING_OPTIONS = ['Free', 'Freemium', 'Paid', 'Contact'] as const;
export type PricingOption = (typeof PRICING_OPTIONS)[number];

export const TOOL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ToolStatusValue = (typeof TOOL_STATUSES)[number];

export const SUBMISSION_STATUSES = ['pending', 'approved', 'rejected'] as const;

export const PAGINATION = {
  DEFAULT_PER_PAGE: 12,
  MAX_PER_PAGE: 50,
  MIN_PER_PAGE: 1,
};

export const RATE_LIMITS = {
  click: { windowMs: 60_000, max: 30 }, // 30 clicks / minute / IP
  submit: { windowMs: 60 * 60_000, max: 5 }, // 5 submissions / hour / IP
  contact: { windowMs: 60 * 60_000, max: 3 }, // 3 contact messages / hour / IP
};

export const TEXT_LIMITS = {
  tool_name: 100,
  tool_description: 2000,
  tool_website: 500,
  tool_logo: 500,
  article_title: 200,
  article_excerpt: 500,
  article_content: 50000,
  article_cover: 500,
  article_author: 100,
  category_name: 80,
  category_description: 500,
  submission_email: 254,
  notes: 1000,
  ad_slot_position: 100,
  ad_slot_code: 8000,
};

// Position keys already wired up in the site's pages, shown to the admin as
// suggestions when adding an ad slot. The position field itself is free
// text — an admin can type any key — but a slot only renders somewhere if an
// <AdSlot position="..."/> using that exact key exists in the frontend.
export const KNOWN_AD_POSITIONS = [
  'home_top',
  'home_middle',
  'home_bottom',
  'tools_list_top',
  'tools_list_bottom',
  'tool_detail_top',
  'tool_detail_middle',
  'tool_detail_bottom',
  'category_top',
  'blog_list_top',
  'blog_post_bottom',
] as const;
