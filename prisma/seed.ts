import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

const categories = [
  { name: "Writing", icon: "✍️", description: "AI tools for writing, copywriting and content creation." },
  { name: "Image", icon: "🎨", description: "Generate, edit and enhance images with AI." },
  { name: "Video", icon: "🎬", description: "AI video generation, editing and avatars." },
  { name: "Code", icon: "💻", description: "AI coding assistants and developer tools." },
  { name: "Audio", icon: "🎧", description: "Speech, music and audio AI tools." },
  { name: "Productivity", icon: "⚡", description: "AI that helps you get more done, faster." },
  { name: "Chat", icon: "💬", description: "Conversational AI assistants and chatbots." },
  { name: "Design", icon: "🖌️", description: "Design tools powered by AI." },
  { name: "Research", icon: "🔬", description: "AI for search, research and knowledge." },
  { name: "Marketing", icon: "📈", description: "AI for SEO, ads, social and growth." },
];

const tools = [
  { name: "WriteGPT", category: "Writing", pricing: "Freemium", desc: "AI writing assistant for blogs, emails and long-form content with a focus on natural tone.", tags: "writing,assistant,copywriting", clicks: 1280 },
  { name: "Draftly", category: "Writing", pricing: "Free", desc: "Turn rough notes into polished drafts in seconds. Great for newsletters and docs.", tags: "notes,newsletter,drafts", clicks: 540 },
  { name: "PixelMuse", category: "Image", pricing: "Freemium", desc: "Generate stunning images from text prompts with fine-grained style control.", tags: "image,text-to-image,art", clicks: 2310 },
  { name: "ColorizeAI", category: "Image", pricing: "Paid", desc: "Restore and colorize old black-and-white photos using modern diffusion models.", tags: "restore,photo,colorize", clicks: 880 },
  { name: "MotionForge", category: "Video", pricing: "Paid", desc: "Generate short marketing videos from a script with AI voiceover and captions.", tags: "video,voiceover,marketing", clicks: 1640 },
  { name: "ReelGenie", category: "Video", pricing: "Freemium", desc: "Turn a single blog post into ready-to-post social reels with automatic editing.", tags: "reels,social,editing", clicks: 720 },
  { name: "CodePilotX", category: "Code", pricing: "Freemium", desc: "Context-aware code completion and refactoring across your whole repository.", tags: "code,assistant,ide", clicks: 4120 },
  { name: "TestGen AI", category: "Code", pricing: "Paid", desc: "Auto-generate unit tests and catch edge cases before they hit production.", tags: "testing,qa,automated", clicks: 990 },
  { name: "VocAI Studio", category: "Audio", pricing: "Freemium", desc: "Ultra-realistic text-to-speech in 40+ languages with emotion control.", tags: "tts,voice,audiobook", clicks: 1450 },
  { name: "PodcastAI", category: "Audio", pricing: "Paid", desc: "Auto-edit podcasts: remove filler, generate show notes and chapter markers.", tags: "podcast,editing,show-notes", clicks: 610 },
  { name: "FlowTasks", category: "Productivity", pricing: "Free", desc: "An AI task manager that plans your week and reschedules intelligently.", tags: "tasks,planner,calendar", clicks: 1120 },
  { name: "MeetMinutes", category: "Productivity", pricing: "Freemium", desc: "AI meeting notes, action items and summaries delivered before the call ends.", tags: "meetings,notes,summary", clicks: 1890 },
  { name: "Nova Chat", category: "Chat", pricing: "Freemium", desc: "A fast general-purpose AI chat assistant with web search and file upload.", tags: "chat,assistant,search", clicks: 5230 },
  { name: "Helpdesk AI", category: "Chat", pricing: "Paid", desc: "Customer support chatbot trained on your docs and tickets with human handoff.", tags: "support,chatbot,helpdesk", clicks: 1340 },
  { name: "BrandKit", category: "Design", pricing: "Freemium", desc: "Generate brand kits, logos and color systems from a short brief.", tags: "brand,logo,design", clicks: 760 },
  { name: "UIForge", category: "Design", pricing: "Paid", desc: "Turn a prompt into production-ready Figma components and Tailwind layouts.", tags: "ui,figma,components", clicks: 1420 },
  { name: "PaperDive", category: "Research", pricing: "Free", desc: "Chat with research papers, get summaries and follow-up questions.", tags: "papers,research,summary", clicks: 690 },
  { name: "ScopeAI", category: "Research", pricing: "Freemium", desc: "AI-assisted literature review with citation graph and gap analysis.", tags: "review,citations,research", clicks: 430 },
  { name: "RankBoost", category: "Marketing", pricing: "Paid", desc: "AI SEO content briefs and SERP analysis to outrank competitors.", tags: "seo,content,serp", clicks: 1560 },
  { name: "PostPilot", category: "Marketing", pricing: "Freemium", desc: "Plan, write and schedule a month of social posts in one sitting.", tags: "social,scheduling,content", clicks: 870 },
];

const articles = [
  {
    title: "The 10 Best AI Writing Tools in 2025",
    excerpt: "We tested dozens of AI writing assistants. Here are the ten worth your time — and where each one shines.",
    content:
      "<p>AI writing tools have matured fast. In this roundup we compare the best options for blogs, email, and long-form content, and explain how to choose between them.</p><h2>What we looked for</h2><p>Quality of output, control over tone, pricing, and integrations with the tools you already use.</p><h2>The winners</h2><p>From general-purpose assistants to specialized copywriters, the field has never been more competitive. Our top pick balances quality and price, but several free options are surprisingly good.</p><blockquote>The best AI writing tool is the one that fits your workflow, not the one with the most features.</blockquote><p>We'll keep this list updated as new tools ship.</p>",
  },
  {
    title: "How to Pick an AI Image Generator",
    excerpt: "Diffusion vs. GANs, style control, licensing — a practical guide to choosing an AI image tool.",
    content:
      "<p>AI image generators are everywhere now, but they're not all the same. Here's how to think about choosing one.</p><h2>Output quality</h2><p>Modern diffusion models produce stunning results, but fine-grained control varies a lot between tools.</p><h2>Licensing</h2><p>Before using generated images commercially, check the license. Some tools restrict commercial use on free tiers.</p>",
  },
  {
    title: "AI Coding Assistants: A 2025 Comparison",
    excerpt: "Context awareness, repo size limits, and price — we compare the leading AI coding tools.",
    content:
      "<p>AI coding assistants have gone from novelty to daily driver for many developers. We compare the leading options.</p><h2>Context matters</h2><p>The biggest differentiator is how much of your codebase the assistant can reason about at once.</p><h2>Price</h2><p>Most tools now offer a free tier that's good enough to evaluate before committing.</p>",
  },
];

async function main() {
  console.log("Seeding Aivora demo data...");

  // Admin — production-safe:
  //   - In production: skip entirely. Provision the admin explicitly via
  //     `bun run db:create-admin` with ADMIN_EMAIL/ADMIN_PASSWORD env vars.
  //   - In dev: create the convenience admin only if one doesn't already
  //     exist, preferring ADMIN_EMAIL/ADMIN_PASSWORD from env when provided.
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    console.log("  production mode: skipping admin creation (use bun run db:create-admin)");
  } else {
    const email = (process.env.ADMIN_EMAIL || "admin@aivora.dev").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const existing = await db.adminUser.findUnique({ where: { email } });
    if (!existing) {
      await db.adminUser.create({
        data: {
          email,
          name: "Aivora Admin",
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
      console.log(`  created dev admin user: ${email}`);
    } else {
      console.log("  admin user already exists");
    }
  }

  // Categories
  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const slug = slugify(c.name);
    const rec = await db.category.upsert({
      where: { slug },
      update: {},
      create: { name: c.name, slug, icon: c.icon, description: c.description },
    });
    catMap[c.name] = rec.id;
  }
  console.log("  categories:", Object.keys(catMap).length);

  // Tools
  let toolCount = 0;
  for (const t of tools) {
    const slug = slugify(t.name);
    const existing = await db.tool.findUnique({ where: { slug } });
    if (existing) continue;
    const catId = catMap[t.category];
    await db.tool.create({
      data: {
        name: t.name,
        slug,
        description: t.desc,
        websiteUrl: `https://${slug}.example.com`,
        categoryId: catId,
        status: "approved",
        pricing: t.pricing,
        tags: t.tags,
        logo: t.name.charAt(0).toUpperCase(),
        clicksCount: t.clicks,
      },
    });
    // Add some clicks for the leaderboard
    const clicksToAdd = Math.min(t.clicks, 50);
    for (let i = 0; i < clicksToAdd; i++) {
      await db.click.create({
        data: {
          toolId: (await db.tool.findUnique({ where: { slug } }))!.id,
          createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 6),
        },
      });
    }
    toolCount++;
  }
  console.log("  tools created:", toolCount);

  // Articles
  let artCount = 0;
  for (const a of articles) {
    const slug = slugify(a.title);
    const existing = await db.article.findUnique({ where: { slug } });
    if (existing) continue;
    await db.article.create({
      data: {
        title: a.title,
        slug,
        excerpt: a.excerpt,
        content: a.content,
        published: true,
        coverImage: null,
      },
    });
    artCount++;
  }
  console.log("  articles created:", artCount);

  // A sample ad slot (disabled by default so it doesn't show until admin enables)
  const adExisting = await db.adSlot.findFirst({ where: { position: "home_top" } });
  if (!adExisting) {
    await db.adSlot.create({
      data: {
        position: "home_top",
        code:
          '<div style="text-align:center;padding:24px;border:2px dashed #64748b;border-radius:12px;color:#94a3b8;font-family:monospace;font-size:13px">Sample ad unit — edit or replace this in /admin/ad-slots</div>',
        isActive: false,
      },
    });
    console.log("  sample ad slot created (disabled)");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
