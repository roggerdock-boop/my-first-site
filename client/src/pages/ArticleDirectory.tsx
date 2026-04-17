import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { BookOpen, ChevronDown, Filter, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ArticleDirectory() {
  const { user, isAuthenticated } = useAuth();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);

  // Fetch filters
  const { data: filters } = trpc.articles.getFilters.useQuery();

  // Fetch articles with filters
  const { data: articles = [], isLoading } = trpc.articles.list.useQuery({
    teams: selectedTeams.length > 0 ? selectedTeams : undefined,
    topics: selectedTopics.length > 0 ? selectedTopics : undefined,
    difficulties: selectedDifficulties.length > 0 ? (selectedDifficulties as any) : undefined,
    limit: 20,
    offset,
  });

  // Filter articles by search query locally
  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    const query = searchQuery.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.summary?.toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
    setOffset(0);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
    setOffset(0);
  };

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty) ? prev.filter((d) => d !== difficulty) : [...prev, difficulty]
    );
    setOffset(0);
  };

  const clearFilters = () => {
    setSelectedTeams([]);
    setSelectedTopics([]);
    setSelectedDifficulties([]);
    setSearchQuery("");
    setOffset(0);
  };

  const hasActiveFilters =
    selectedTeams.length > 0 ||
    selectedTopics.length > 0 ||
    selectedDifficulties.length > 0 ||
    searchQuery;

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
            {isAuthenticated && (
              <>
                <Link href="/create">
                  <a className="text-foreground hover:text-accent transition-colors">Create</a>
                </Link>
                <Link href="/saved">
                  <a className="text-foreground hover:text-accent transition-colors">Saved</a>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-base"
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="flex items-center justify-between mb-4 md:mb-0">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden text-accent"
              >
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            <div
              className={`space-y-6 ${showFilters ? "block" : "hidden"} md:block bg-card md:bg-transparent p-4 md:p-0 rounded-lg md:rounded-none border md:border-0 border-border`}
            >
              {/* Teams Filter */}
              {filters?.teams && filters.teams.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
                    Team
                  </h3>
                  <div className="space-y-2">
                    {(filters.teams.filter(Boolean) as string[]).map((team) => (
                      <label key={team} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedTeams.includes(team)}
                          onCheckedChange={() => toggleTeam(team)}
                        />
                        <span className="text-sm">{team}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics Filter */}
              {filters?.topics && filters.topics.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
                    Topic
                  </h3>
                  <div className="space-y-2">
                    {(filters.topics.filter(Boolean) as string[]).map((topic) => (
                      <label key={topic} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedTopics.includes(topic)}
                          onCheckedChange={() => toggleTopic(topic)}
                        />
                        <span className="text-sm">{topic}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty Filter */}
              {filters?.difficulties && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
                    Difficulty
                  </h3>
                  <div className="space-y-2">
                    {filters.difficulties.map((difficulty) => (
                      <label
                        key={difficulty}
                        className="flex items-center gap-2 cursor-pointer capitalize"
                      >
                        <Checkbox
                          checked={selectedDifficulties.includes(difficulty)}
                          onCheckedChange={() => toggleDifficulty(difficulty)}
                        />
                        <span className="text-sm">{difficulty}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Articles List */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading articles...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No articles found</p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
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
                              Team: {article.team}
                            </span>
                          )}
                          {article.topic && (
                            <span className="bg-muted px-2 py-1 rounded">
                              Topic: {article.topic}
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
    </div>
  );
}
