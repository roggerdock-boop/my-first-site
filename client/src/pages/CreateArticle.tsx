import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function CreateArticle() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [team, setTeam] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [published, setPublished] = useState(false);

  const createMutation = trpc.articles.create.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to create articles</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        title,
        summary,
        content,
        team: team || undefined,
        topic: topic || undefined,
        difficulty,
        published,
      });
      
      toast.success("Article created successfully!");
      setLocation(`/articles/${result.slug}`);
    } catch (error) {
      toast.error("Failed to create article");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-bold">Engineering KB</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Create Article</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title"
                className="text-base"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-semibold mb-2">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of the article"
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                rows={2}
              />
            </div>

            {/* Metadata */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Team</label>
                <Input
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="e.g., Backend, Frontend"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Topic</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Database, Performance"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold mb-2">Content (Markdown) *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article in Markdown..."
                className="w-full p-4 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                rows={20}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Supports Markdown syntax including code blocks, lists, and formatting.
              </p>
            </div>

            {/* Publish */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 border border-border rounded bg-background cursor-pointer"
              />
              <label htmlFor="published" className="text-sm font-medium cursor-pointer">
                Publish immediately
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-border">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-accent hover:bg-accent/90"
              >
                {createMutation.isPending ? "Creating..." : "Create Article"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/articles")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
