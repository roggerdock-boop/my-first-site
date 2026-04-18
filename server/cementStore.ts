import fs from 'node:fs/promises';
import path from 'node:path';

export type CementCategory = 'Raw Mill' | 'Kiln' | 'Cement Mill' | 'Optimization';

export type CementArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: CementCategory;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const dataDir = path.resolve(process.cwd(), 'data');
const filePath = path.join(dataDir, 'cement-articles.json');

const seed: CementArticle[] = [
  {
    id: '1',
    slug: 'kiln-heat-balance-practical-guide',
    title: 'Kiln Heat Balance: Practical Guide for Daily Optimization',
    excerpt: 'A step-by-step method to reduce specific heat consumption using heat balance checkpoints.',
    content: `# Kiln Heat Balance: Practical Guide\n\nA robust heat balance helps operators quickly identify where energy is being lost.\n\n## Core checkpoints\n- Verify kiln shell losses weekly\n- Trend preheater exit gas temperature\n- Control free lime while reducing fuel\n\n## Common actions\n1. Stabilize feed chemistry and moisture\n2. Reduce false air at hood and preheater\n3. Optimize burner momentum and flame shape`,
    category: 'Kiln',
    seoTitle: 'Kiln Heat Balance Optimization Guide | Cement Platform',
    seoDescription: 'Improve kiln thermal efficiency with a practical heat balance workflow and daily actions.',
    tags: ['kiln', 'heat balance', 'energy'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'raw-mill-drying-capacity-improvement',
    title: 'How to Improve Raw Mill Drying Capacity in High Moisture Season',
    excerpt: 'Control inlet temperature, gas flow, and feed split to protect mill output.',
    content: `# Raw Mill Drying Capacity\n\nMoist feed reduces mill throughput unless drying variables are tightly managed.\n\n## Focus areas\n- Hot gas availability\n- Classifier speed discipline\n- Differential pressure trend\n\n## Action plan\n- Pre-blend wet quarry zones\n- Increase gas temperature in controlled increments\n- Maintain stable separator cut size`,
    category: 'Raw Mill',
    seoTitle: 'Raw Mill Drying Capacity Improvement | Cement Platform',
    seoDescription: 'Increase raw mill output during wet season through drying and separator optimization.',
    tags: ['raw mill', 'drying', 'throughput'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(seed, null, 2), 'utf-8');
  }
}

export async function listCementArticles(category?: string) {
  await ensureStore();
  const raw = await fs.readFile(filePath, 'utf-8');
  const items: CementArticle[] = JSON.parse(raw);
  const sorted = items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  if (!category || category === 'All') return sorted;
  return sorted.filter((x) => x.category === category);
}

export async function getCementArticleBySlug(slug: string) {
  const items = await listCementArticles();
  return items.find((x) => x.slug === slug);
}

export async function upsertCementArticle(input: Omit<CementArticle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const items = await listCementArticles();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = items.findIndex((x) => x.id === input.id);
    if (idx >= 0) {
      const existing = items[idx];
      items[idx] = { ...existing, ...input, updatedAt: now };
      await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
      return items[idx];
    }
  }

  const next = {
    ...input,
    id: String(Date.now()),
    createdAt: now,
    updatedAt: now,
  };

  items.push(next);
  await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
  return next;
}
