# Cement Process Optimization Platform

Production-ready full-stack website built with **React + Vite + Node + tRPC**.

## Features

- SEO blog system with clean URLs (`/blog/:slug`), article categories, and metadata fields.
- Admin blog panel (`/admin`) for create/edit publishing.
- 13 calculators with practical optimization suggestions:
  - Kiln: Heat Balance, SHC, False Air
  - Raw Mill: TPH Output, Drying Capacity, Power Consumption
  - Cement Mill: Output, Grinding Efficiency, Separator Efficiency
  - Others: Coal Consumption, AFR, Clinker Factor, Cost per Ton
- AI chatbot (floating, mobile friendly) with:
  - General Chat mode
  - Cement Expert mode
- Site pages: Home, Blog, Tool pages, About, Contact, Privacy Policy, Terms, Disclaimer.
- Industrial-themed dashboard UI optimized for mobile-first rendering.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, shadcn/ui components, Wouter
- Backend: Express, tRPC, TypeScript
- Content storage: JSON-based file storage (`data/cement-articles.json`) for lightweight deployment
- AI: LLM integration through server `invokeLLM` utility with fallback responses

## Run locally

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000`.

## Production build

```bash
pnpm build
pnpm start
```

## Admin usage

1. Open `/admin`.
2. Enter `adminKey`.
3. Add article content with SEO fields.
4. Click **Save Article**.

Default admin key (change in production):

- `cement-admin-2026`

Set secure key in environment:

```bash
export CEMENT_ADMIN_KEY="your-strong-secret"
```

## SEO implementation

- Dynamic page `<title>` and `<meta name="description">`
- Article-level `seoTitle` + `seoDescription`
- Structured H1/H2 content hierarchy and semantic page layout
- Human-readable route slugs for tools and blog pages

## Deployment notes

- Works on any Node.js host with static + API support.
- Persistent article data is saved to `data/cement-articles.json`.
- For multi-instance deployments, move storage to a shared DB/service (e.g., MySQL/Firebase).
