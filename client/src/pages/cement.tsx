import { useMemo, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useSeo } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CalcField = { key: string; label: string; unit?: string; defaultValue: number };
type Calc = { slug: string; title: string; fields: CalcField[]; formula: (values: Record<string, number>) => number; insight: (result: number, values: Record<string, number>) => string[]; unit: string; group: string };

const calcs: Calc[] = [
  { slug: 'kiln-heat-balance', title: 'Kiln Heat Balance', group: 'Kiln', unit: 'kcal/kg clinker', fields: [{ key: 'fuel', label: 'Fuel Heat Input', unit: 'kcal/kg', defaultValue: 860 }, { key: 'losses', label: 'Total Heat Losses', unit: 'kcal/kg', defaultValue: 210 }], formula: (v) => v.fuel - v.losses, insight: (r) => [r < 650 ? 'Thermal efficiency is low. Audit shell losses and preheater false air.' : 'Thermal performance is acceptable; fine-tune burner and excess air.'] },
  { slug: 'kiln-shc', title: 'Specific Heat Consumption (SHC)', group: 'Kiln', unit: 'kcal/kg clinker', fields: [{ key: 'fuelKgH', label: 'Fuel Flow', unit: 'kg/h', defaultValue: 9000 }, { key: 'gcv', label: 'Fuel GCV', unit: 'kcal/kg', defaultValue: 6200 }, { key: 'clinker', label: 'Clinker Production', unit: 'kg/h', defaultValue: 82000 }], formula: (v) => (v.fuelKgH * v.gcv) / v.clinker, insight: (r) => [r > 740 ? 'High SHC. Check kiln inlet O₂, kiln hood pressure, and coating stability.' : 'SHC is controlled. Maintain feed chemistry consistency and draft control.'] },
  { slug: 'kiln-false-air', title: 'Kiln False Air', group: 'Kiln', unit: '%', fields: [{ key: 'inletO2', label: 'Inlet O2', unit: '%', defaultValue: 3.5 }, { key: 'outletO2', label: 'Outlet O2', unit: '%', defaultValue: 8.5 }], formula: (v) => Math.max(0, ((v.outletO2 - v.inletO2) / 21) * 100), insight: (r) => [r > 20 ? 'False air is high. Inspect kiln hood seals, preheater doors, and expansion joints.' : 'False air is within a manageable range. Keep sealing audits weekly.'] },
  { slug: 'raw-mill-tph-output', title: 'Raw Mill TPH Output', group: 'Raw Mill', unit: 'TPH', fields: [{ key: 'feed', label: 'Total Feed', unit: 't', defaultValue: 320 }, { key: 'hours', label: 'Operating Hours', unit: 'h', defaultValue: 4 }], formula: (v) => v.feed / v.hours, insight: (r) => [r < 80 ? 'Low TPH. Evaluate feed moisture and separator speed.' : 'Good output. Check power per ton to confirm energy efficiency.'] },
  { slug: 'raw-mill-drying-capacity', title: 'Raw Mill Drying Capacity', group: 'Raw Mill', unit: 't/h moisture removed', fields: [{ key: 'gas', label: 'Hot Gas Flow', unit: 'Nm3/h', defaultValue: 320000 }, { key: 'deltaHum', label: 'Humidity Rise', unit: 'kg/Nm3', defaultValue: 0.018 }], formula: (v) => (v.gas * v.deltaHum) / 1000, insight: (r) => [r < 4 ? 'Drying margin is low. Raise inlet gas temperature and reduce wet feed spikes.' : 'Drying capacity is acceptable. Maintain stable gas and feed blending.'] },
  { slug: 'raw-mill-power', title: 'Raw Mill Power Consumption', group: 'Raw Mill', unit: 'kWh/t', fields: [{ key: 'power', label: 'Power Draw', unit: 'kW', defaultValue: 4200 }, { key: 'tph', label: 'Mill Output', unit: 't/h', defaultValue: 185 }], formula: (v) => v.power / v.tph, insight: (r) => [r > 26 ? 'Energy is high. Review grinding pressure, table speed, and reject circulation.' : 'Power consumption is healthy. Continue controlling vibration and feed PSD.'] },
  { slug: 'cement-mill-output', title: 'Cement Mill Output', group: 'Cement Mill', unit: 'TPH', fields: [{ key: 'tons', label: 'Produced Cement', unit: 't', defaultValue: 580 }, { key: 'hours', label: 'Operating Hours', unit: 'h', defaultValue: 8 }], formula: (v) => v.tons / v.hours, insight: (r) => [r < 70 ? 'Output is constrained. Check separator loading and ventilation.' : 'Output is stable. Fine tune gypsum and additive dosing for quality and throughput.'] },
  { slug: 'cement-mill-grinding-efficiency', title: 'Grinding Efficiency', group: 'Cement Mill', unit: '%', fields: [{ key: 'newSurface', label: 'Useful Grinding Work', unit: 'kWh/t', defaultValue: 18 }, { key: 'totalPower', label: 'Total Grinding Power', unit: 'kWh/t', defaultValue: 30 }], formula: (v) => (v.newSurface / v.totalPower) * 100, insight: (r) => [r < 60 ? 'Efficiency is low. Inspect media grading and diaphragm condition.' : 'Grinding efficiency is good. Maintain media top-up strategy.'] },
  { slug: 'cement-mill-separator-efficiency', title: 'Separator Efficiency', group: 'Cement Mill', unit: '%', fields: [{ key: 'finesProduct', label: 'Fines in Product', unit: '%', defaultValue: 87 }, { key: 'finesReject', label: 'Fines in Reject', unit: '%', defaultValue: 16 }], formula: (v) => ((v.finesProduct - v.finesReject) / v.finesProduct) * 100, insight: (r) => [r < 75 ? 'Separator efficiency is weak. Check rotor speed and airflow balancing.' : 'Separator efficiency is acceptable. Keep cage and guide vanes clean.'] },
  { slug: 'coal-consumption', title: 'Coal Consumption', group: 'Others', unit: 'kg/t clinker', fields: [{ key: 'coal', label: 'Coal Used', unit: 'kg/h', defaultValue: 9300 }, { key: 'clinker', label: 'Clinker Output', unit: 't/h', defaultValue: 118 }], formula: (v) => v.coal / v.clinker, insight: (r) => [r > 82 ? 'Coal rate is high. Improve calcination and burner tuning.' : 'Coal consumption is in a competitive band.'] },
  { slug: 'afr-rate', title: 'AFR Thermal Substitution', group: 'Others', unit: '%', fields: [{ key: 'afrHeat', label: 'AFR Heat', unit: 'GJ/h', defaultValue: 32 }, { key: 'totalHeat', label: 'Total Heat', unit: 'GJ/h', defaultValue: 165 }], formula: (v) => (v.afrHeat / v.totalHeat) * 100, insight: (r) => [r < 15 ? 'AFR share is low. Build consistent pre-processing and feeding reliability.' : 'Good AFR substitution; monitor chlorine and alkali cycles.'] },
  { slug: 'clinker-factor', title: 'Clinker Factor', group: 'Others', unit: '%', fields: [{ key: 'clinker', label: 'Clinker in Cement', unit: 't', defaultValue: 78 }, { key: 'cement', label: 'Total Cement', unit: 't', defaultValue: 100 }], formula: (v) => (v.clinker / v.cement) * 100, insight: (r) => [r > 75 ? 'Clinker factor is high; consider SCM optimization to cut CO₂ and cost.' : 'Clinker factor is optimized; ensure strength and setting compliance.'] },
  { slug: 'cost-per-ton', title: 'Cost per Ton', group: 'Others', unit: 'USD/t', fields: [{ key: 'totalCost', label: 'Total Plant Cost', unit: 'USD/day', defaultValue: 95000 }, { key: 'output', label: 'Cement Output', unit: 't/day', defaultValue: 3250 }], formula: (v) => v.totalCost / v.output, insight: (r) => [r > 35 ? 'Unit cost is high. Prioritize power optimization and AFR share improvement.' : 'Cost per ton is competitive. Maintain reliability-centered maintenance.'] },
];

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 text-slate-100"><div className="container py-6">{children}</div></div>;
}

function Nav() {
  const [loc] = useLocation();
  const items = [
    ['/', 'Home'], ['/blog', 'Blog'], ['/tools', 'Tools'], ['/about', 'About'], ['/contact', 'Contact'], ['/admin', 'Admin'], ['/privacy-policy', 'Privacy'], ['/terms', 'Terms'], ['/disclaimer', 'Disclaimer'],
  ] as const;
  return <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"><Link href="/"><strong>Cement Process Optimization Platform</strong></Link><nav className="flex flex-wrap gap-2 text-sm">{items.map(([href, label]) => <Link key={href} href={href} className={`rounded-md px-2 py-1 ${loc === href ? 'bg-emerald-600' : 'bg-slate-800'}`}>{label}</Link>)}</nav></header>;
}

function HomePage() {
  useSeo({ title: 'Cement Process Optimization Platform', description: 'Industrial tools, calculators, and optimization blog for cement process teams.' });
  const { data } = trpc.cement.articles.list.useQuery({});
  const latest = (data || []).slice(0, 3);
  return <Shell><Nav /><section className="grid gap-4 md:grid-cols-3">{['Kiln','Raw Mill','Cement Mill'].map(x => <Card key={x} className="bg-slate-900 border-slate-800"><CardHeader><CardTitle>{x} Tools</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-300">Operational calculators with optimization hints for {x.toLowerCase()} performance.</p></CardContent></Card>)}</section><section className="mt-6"><h2 className="mb-3 text-xl font-bold">Latest Articles</h2><div className="grid gap-3 md:grid-cols-3">{latest.map(a => <Card key={a.id} className="bg-slate-900 border-slate-800"><CardHeader><CardTitle className="text-base">{a.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-300 mb-2">{a.excerpt}</p><Link href={`/blog/${a.slug}`} className="text-emerald-400">Read article</Link></CardContent></Card>)}</div></section><Chatbot /></Shell>;
}

function BlogPage() {
  useSeo({ title: 'Blog | Cement Optimization', description: 'SEO-focused cement process optimization articles for kiln, raw mill, and cement mill teams.' });
  const [cat, setCat] = useState('All');
  const { data } = trpc.cement.articles.list.useQuery({ category: cat === 'All' ? undefined : cat });
  return <Shell><Nav /><h1 className="text-2xl font-bold mb-4">Optimization Blog</h1><div className="mb-4 flex gap-2">{['All','Raw Mill','Kiln','Cement Mill','Optimization'].map(c => <Button key={c} variant="secondary" onClick={() => setCat(c)}>{c}</Button>)}</div><div className="grid md:grid-cols-2 gap-3">{(data || []).map(a => <Card key={a.id} className="bg-slate-900 border-slate-800"><CardHeader><CardTitle>{a.title}</CardTitle></CardHeader><CardContent><p className="text-slate-300 text-sm mb-2">{a.excerpt}</p><p className="text-xs text-slate-400 mb-2">Category: {a.category}</p><Link href={`/blog/${a.slug}`} className="text-emerald-400">Open</Link></CardContent></Card>)}</div><Chatbot /></Shell>;
}

function BlogDetail({ params }: { params: { slug: string } }) {
  const { data } = trpc.cement.articles.bySlug.useQuery({ slug: params.slug });
  useSeo({ title: data?.seoTitle || 'Article', description: data?.seoDescription || 'Cement process article' });
  if (!data) return <Shell><Nav /><p>Loading...</p></Shell>;
  return <Shell><Nav /><article className="prose prose-invert max-w-3xl"><h1>{data.title}</h1><p>{data.excerpt}</p><pre className="whitespace-pre-wrap text-sm bg-slate-900 border border-slate-800 p-4 rounded">{data.content}</pre></article><Chatbot /></Shell>;
}

function ToolsPage() {
  useSeo({ title: 'Calculators | Cement Platform', description: 'Heat balance, SHC, false air, mill and cost calculators with optimization suggestions.' });
  const groups = useMemo(() => Array.from(new Set(calcs.map(c => c.group))), []);
  return <Shell><Nav /><h1 className="text-2xl font-bold mb-3">Process Calculators</h1><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">{groups.map(g => <Card key={g} className="bg-slate-900 border-slate-800"><CardHeader><CardTitle>{g}</CardTitle></CardHeader><CardContent className="space-y-2">{calcs.filter(c => c.group === g).map(c => <Link key={c.slug} className="block text-emerald-400" href={`/tools/${c.slug}`}>{c.title}</Link>)}</CardContent></Card>)}</div><Chatbot /></Shell>;
}

function ToolDetail({ params }: { params: { slug: string } }) {
  const calc = calcs.find(c => c.slug === params.slug);
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries((calc?.fields || []).map(f => [f.key, f.defaultValue])));
  if (!calc) return <Shell><Nav /><p>Calculator not found.</p></Shell>;
  const result = calc.formula(values);
  const advice = calc.insight(result, values);
  useSeo({ title: `${calc.title} Calculator`, description: `${calc.title} with actionable optimization suggestions for cement process teams.` });
  return <Shell><Nav /><h1 className="text-2xl font-bold mb-4">{calc.title}</h1><Card className="bg-slate-900 border-slate-800 max-w-2xl"><CardContent className="pt-6 space-y-3">{calc.fields.map(f => <div key={f.key}><label className="text-sm">{f.label} {f.unit && `(${f.unit})`}</label><Input type="number" value={values[f.key] ?? 0} onChange={(e) => setValues(v => ({ ...v, [f.key]: Number(e.target.value) }))} /></div>)}<div className="rounded-lg bg-slate-800 p-3"><p className="text-sm text-slate-300">Result</p><p className="text-2xl font-bold text-emerald-400">{result.toFixed(2)} {calc.unit}</p></div><div><p className="font-semibold">Optimization Suggestions</p><ul className="list-disc pl-5 text-sm text-slate-300">{advice.map((a, i) => <li key={i}>{a}</li>)}</ul></div></CardContent></Card><Chatbot /></Shell>;
}

function AdminPage() {
  useSeo({ title: 'Admin Blog Panel', description: 'Create and edit SEO-ready cement optimization articles.' });
  const [form, setForm] = useState({ adminKey: '', id: '', slug: '', title: '', excerpt: '', content: '', category: 'Optimization', seoTitle: '', seoDescription: '', tags: 'cement,optimization' });
  const mutation = trpc.cement.articles.upsert.useMutation();
  return <Shell><Nav /><h1 className="text-2xl font-bold mb-3">Admin - Blog Management</h1><Card className="bg-slate-900 border-slate-800 max-w-3xl"><CardContent className="pt-6 grid gap-3">{['adminKey','id','slug','title','excerpt','seoTitle','seoDescription','tags'].map((k) => <Input key={k} placeholder={k} value={(form as any)[k]} onChange={e => setForm(v => ({ ...v, [k]: e.target.value }))} />)}<Select value={form.category} onValueChange={v => setForm(s => ({ ...s, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Raw Mill','Kiln','Cement Mill','Optimization'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><Textarea rows={8} placeholder="Markdown content" value={form.content} onChange={(e) => setForm(v => ({ ...v, content: e.target.value }))} /><Button onClick={() => mutation.mutate({ ...form, id: form.id || undefined, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), category: form.category as any })}>Save Article</Button>{mutation.isSuccess && <p className="text-emerald-400 text-sm">Saved successfully.</p>}{mutation.error && <p className="text-red-400 text-sm">{mutation.error.message}</p>}</CardContent></Card><Chatbot /></Shell>;
}

function StaticPage({ title, text }: { title: string; text: string }) { useSeo({ title, description: text }); return <Shell><Nav /><h1 className="text-2xl font-bold mb-2">{title}</h1><p className="text-slate-300 max-w-3xl">{text}</p><Chatbot /></Shell>; }

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'general' | 'expert'>('general');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [value, setValue] = useState('');
  const chat = trpc.cement.chat.useMutation();
  const send = () => {
    if (!value.trim() || chat.isPending) return;
    const next = [...messages, { role: 'user' as const, content: value }];
    setMessages(next);
    setValue('');
    chat.mutate({ mode, messages: next }, { onSuccess: (res) => setMessages(m => [...m, { role: 'assistant', content: res.reply }]) });
  };
  return <div className="fixed bottom-4 right-4 z-50"><Button className="rounded-full" onClick={() => setOpen(!open)}>{open ? 'Close Chat' : 'AI Chat'}</Button>{open && <div className="mt-2 w-[92vw] max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl"><div className="mb-2 flex items-center justify-between"><strong>Assistant</strong><Select value={mode} onValueChange={(v: any) => setMode(v)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General Chat</SelectItem><SelectItem value="expert">Cement Expert</SelectItem></SelectContent></Select></div><div className="h-56 overflow-auto rounded bg-slate-950 p-2 text-sm">{messages.length === 0 ? <p className="text-slate-400">Ask about kiln, mills, SHC, false air, cost optimization...</p> : messages.map((m, i) => <p key={i} className={m.role === 'user' ? 'text-emerald-300 mb-2' : 'text-slate-200 mb-2'}><b>{m.role === 'user' ? 'You' : 'AI'}:</b> {m.content}</p>)}</div><div className="mt-2 flex gap-2"><Input value={value} onChange={e => setValue(e.target.value)} placeholder="Type message" /><Button onClick={send}>Send</Button></div></div>}</div>;
}

export function CementAppRoutes() {
  return <Switch>
    <Route path="/" component={HomePage} />
    <Route path="/blog" component={BlogPage} />
    <Route path="/blog/:slug" component={BlogDetail} />
    <Route path="/tools" component={ToolsPage} />
    <Route path="/tools/:slug" component={ToolDetail} />
    <Route path="/about">{() => <StaticPage title="About" text="We help cement plants improve thermal efficiency, grinding performance, and operating cost with practical tools and domain-specific guidance." />}</Route>
    <Route path="/contact">{() => <StaticPage title="Contact" text="For implementation support, email ops@cementoptplatform.com. Include kiln line, mill type, and baseline KPIs for faster response." />}</Route>
    <Route path="/privacy-policy">{() => <StaticPage title="Privacy Policy" text="We only store information required for service operation. Admin credentials should be managed securely via environment variables." />}</Route>
    <Route path="/terms">{() => <StaticPage title="Terms" text="Use calculators for engineering guidance only. Validate values against plant instrumentation and lab data before operational changes." />}</Route>
    <Route path="/disclaimer">{() => <StaticPage title="Disclaimer" text="Outputs are informational and not a substitute for site safety procedures, OEM limits, or regulatory compliance requirements." />}</Route>
    <Route path="/admin" component={AdminPage} />
    <Route>{() => <StaticPage title="Not Found" text="The requested page does not exist." />}</Route>
  </Switch>;
}
