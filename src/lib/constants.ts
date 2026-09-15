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
};
