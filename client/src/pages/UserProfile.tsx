import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { BookOpen, MessageCircle } from "lucide-react";

export default function UserProfile() {
  const [, params] = useRoute("/profile/:userId");
  const userId = parseInt(params?.userId || "0");

  const { data: profile, isLoading } = trpc.users.getProfile.useQuery({ userId });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button asChild>
            <Link href="/articles">
              <a>Back to Articles</a>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { user, articles, comments } = profile;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
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
        {/* User Info */}
        <Card className="p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
          {user.bio && <p className="text-muted-foreground mb-4">{user.bio}</p>}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
            <span>{articles.length} articles</span>
            <span>{comments.length} comments</span>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Articles */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Articles ({articles.length})
            </h2>
            <div className="space-y-4">
              {articles.length === 0 ? (
                <p className="text-muted-foreground">No articles yet</p>
              ) : (
                articles.map((article) => (
                  <Link key={article.id} href={`/articles/${article.slug}`}>
                    <a className="block">
                      <Card className="p-4 hover:shadow-md hover:border-accent transition-all cursor-pointer">
                        <h3 className="font-semibold mb-2 hover:text-accent transition-colors">
                          {article.title}
                        </h3>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{article.viewCount} views</span>
                          <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString()}</span>
                        </div>
                      </Card>
                    </a>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Comments ({comments.length})
            </h2>
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-muted-foreground">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id} className="p-4">
                    <p className="text-sm mb-2 line-clamp-3">{comment.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
