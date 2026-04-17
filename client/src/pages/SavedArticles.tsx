import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { BookOpen, Heart } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function SavedArticles() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: saved = [], isLoading } = trpc.saved.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view saved articles</p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="w-6 h-6 text-accent" />
              <h1 className="text-2xl font-bold">Engineering KB</h1>
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/articles">
              <a className="text-foreground hover:text-accent transition-colors">Browse</a>
            </Link>
            <Link href="/create">
              <a className="text-foreground hover:text-accent transition-colors">Create</a>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-accent fill-accent" />
            Saved Articles
          </h1>
          <p className="text-muted-foreground mb-8">
            {saved.length} article{saved.length !== 1 ? "s" : ""} saved
          </p>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading saved articles...</p>
            </div>
          ) : saved.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No saved articles yet</p>
              <Button asChild>
                <Link href="/articles">
                  <a>Browse Articles</a>
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {saved.map(({ article }) => (
                <Link key={article.id} href={`/articles/${article.slug}`}>
                  <a className="block">
                    <Card className="p-6 hover:shadow-md hover:border-accent transition-all cursor-pointer group">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">
                          {article.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${
                            article.difficulty === "beginner"
                              ? "bg-green-100 text-green-700"
                              : article.difficulty === "intermediate"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {article.difficulty}
                        </span>
                      </div>
                      {article.summary && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {article.team && (
                          <span className="bg-muted px-2 py-1 rounded">
                            Team: {article.team || ""}
                          </span>
                        )}
                        {article.topic && (
                          <span className="bg-muted px-2 py-1 rounded">
                            Topic: {article.topic || ""}
                          </span>
                        )}
                        <span className="bg-muted px-2 py-1 rounded">
                          {article.viewCount} views
                        </span>
                        <span className="bg-muted px-2 py-1 rounded">
                          {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
