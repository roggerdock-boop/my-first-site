import { useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { BookOpen, Heart, MessageCircle, Star } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function ArticleDetail() {
  const [, params] = useRoute("/articles/:slug");
  const { user, isAuthenticated } = useAuth();
  const slug = params?.slug || "";
  
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch article
  const { data: article, isLoading } = trpc.articles.getBySlug.useQuery({ slug });

  // Fetch comments
  const { data: comments = [] } = trpc.comments.getByArticle.useQuery(
    { articleId: article?.id || 0 },
    { enabled: !!article }
  );

  // Fetch ratings
  const { data: ratings } = trpc.ratings.getByArticle.useQuery(
    { articleId: article?.id || 0 },
    { enabled: !!article }
  );

  // Fetch user's rating
  const { data: myRating } = trpc.ratings.getUserRating.useQuery(
    { articleId: article?.id || 0 },
    { enabled: !!article && isAuthenticated }
  );

  // Fetch saved status
  const { data: savedStatus } = trpc.saved.isSaved.useQuery(
    { articleId: article?.id || 0 },
    { enabled: !!article && isAuthenticated }
  );

  // Mutations
  const rateMutation = trpc.ratings.rate.useMutation();
  const saveMutation = trpc.saved.save.useMutation();
  const unsaveMutation = trpc.saved.unsave.useMutation();
  const recordViewMutation = trpc.articles.recordView.useMutation();
  const createCommentMutation = trpc.comments.create.useMutation();

  // Record view on load
  if (article && !isLoading) {
    recordViewMutation.mutate({ articleId: article.id });
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Article not found</p>
          <Button asChild>
            <Link href="/articles">
              <a>Back to Articles</a>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleRate = (score: number) => {
    if (!isAuthenticated) return;
    rateMutation.mutate({ articleId: article.id, score });
    setUserRating(score);
  };

  const handleSave = () => {
    if (!isAuthenticated) return;
    if (isSaved) {
      unsaveMutation.mutate({ articleId: article.id });
    } else {
      saveMutation.mutate({ articleId: article.id });
    }
    setIsSaved(!isSaved);
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
          <Button asChild variant="outline">
            <Link href="/articles">
              <a>Back to Articles</a>
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {article.team && <span className="bg-muted px-2 py-1 rounded">{article.team}</span>}
                  {article.topic && <span className="bg-muted px-2 py-1 rounded">{article.topic}</span>}
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
                </div>
              </div>
              {isAuthenticated && (
                <Button
                  onClick={handleSave}
                  variant={isSaved ? "default" : "outline"}
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                </Button>
              )}
            </div>

            {article.summary && (
              <p className="text-lg text-muted-foreground mb-4">{article.summary}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-b border-border py-4">
              <span>{article.viewCount} views</span>
              <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Article Content */}
          <Card className="p-8 mb-8 prose prose-sm max-w-none">
            <Streamdown>{article.content}</Streamdown>
          </Card>

          {/* Rating Section */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Rate this Article
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleRate(score)}
                    className={`text-2xl transition-colors ${
                      (userRating || myRating?.score || 0) >= score
                        ? "text-yellow-400"
                        : "text-muted-foreground hover:text-yellow-400"
                    }`}
                    disabled={!isAuthenticated}
                  >
                    ★
                  </button>
                ))}
              </div>
              {ratings && (
                <span className="text-muted-foreground">
                  {ratings.average.toFixed(1)} / 5 ({ratings.count} ratings)
                </span>
              )}
            </div>
          </Card>

          {/* Comments Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments.length})
            </h2>
            
            {isAuthenticated && (
              <div className="mb-6 pb-6 border-b border-border">
                <textarea
                  placeholder="Add a comment..."
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={3}
                />
                <Button className="mt-2 bg-accent hover:bg-accent/90">Post Comment</Button>
              </div>
            )}

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">User #{comment.authorId}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
