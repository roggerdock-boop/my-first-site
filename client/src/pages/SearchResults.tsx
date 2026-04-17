import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { BookOpen, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchResults() {
  const [, params] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);

  // Extract query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q") || "";
    setSearchQuery(q);
  }, []);

  const { data: results = [], isLoading } = trpc.search.articles.useQuery(
    { query: searchQuery, limit: 20, offset },
    { enabled: searchQuery.length > 0 }
  );

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOffset(0);
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q") as string;
    setSearchQuery(query);
    window.history.replaceState({}, "", `?q=${encodeURIComponent(query)}`);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

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
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6 text-base"
              />
            </div>
          </form>

          {/* Results */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : searchQuery.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Enter a search query to get started</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No articles found for "{searchQuery}"</p>
              <Button asChild variant="outline">
                <Link href="/articles">
                  <a>Browse All Articles</a>
                </Link>
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-6">
                Found {results.length} result{results.length !== 1 ? "s" : ""} for "{searchQuery}"
              </p>
              <div className="space-y-4">
                {results.map(({ article, relevance }) => (
                  <Link key={article.id} href={`/articles/${article.slug}`}>
                    <a className="block">
                      <Card className="p-6 hover:shadow-md hover:border-accent transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">
                            {highlightText(article.title, searchQuery)}
                          </h3>
                          <span className="text-xs font-medium text-muted-foreground ml-4 flex-shrink-0">
                            Relevance: {relevance}
                          </span>
                        </div>
                        {article.summary && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {highlightText(article.summary, searchQuery)}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {article.team && (
                            <span className="bg-muted px-2 py-1 rounded">
                              Team: {article.team}
                            </span>
                          )}
                          {article.topic && (
                            <span className="bg-muted px-2 py-1 rounded">
                              Topic: {article.topic}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded font-medium ${
                              article.difficulty === "beginner"
                                ? "bg-green-100 text-green-700"
                                : article.difficulty === "intermediate"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {article.difficulty}
                          </span>
                          <span className="bg-muted px-2 py-1 rounded">
                            {article.viewCount} views
                          </span>
                        </div>
                      </Card>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
