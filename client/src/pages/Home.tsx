import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { BookOpen, Search, Users, Zap } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Navigation */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-bold">Engineering KB</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/articles">
              <a className="text-foreground hover:text-accent transition-colors">Browse</a>
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/create">
                  <a className="text-foreground hover:text-accent transition-colors">Create</a>
                </Link>
                <Link href="/saved">
                  <a className="text-foreground hover:text-accent transition-colors">Saved</a>
                </Link>
                <Link href={`/profile/${user?.id}`}>
                  <a className="text-foreground hover:text-accent transition-colors">Profile</a>
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <span className="text-sm text-muted-foreground">Hi, {user?.name}</span>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6 text-foreground">
            Centralized Engineering Knowledge
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Share, discover, and collaborate on technical documentation, guides, and best practices with your engineering team.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
              <Link href="/articles">Browse Articles</Link>
            </Button>
            {isAuthenticated && (
              <Button asChild size="lg" variant="outline">
                <Link href="/create">Write Article</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold mb-12 text-center">Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-card border border-border rounded-lg">
              <Search className="w-8 h-8 text-accent mb-4" />
              <h4 className="font-semibold mb-2">Smart Search</h4>
              <p className="text-sm text-muted-foreground">
                Find articles with relevance scoring and highlighted search results.
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg">
              <BookOpen className="w-8 h-8 text-accent mb-4" />
              <h4 className="font-semibold mb-2">Rich Content</h4>
              <p className="text-sm text-muted-foreground">
                Markdown rendering with syntax-highlighted code blocks and tables of contents.
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg">
              <Users className="w-8 h-8 text-accent mb-4" />
              <h4 className="font-semibold mb-2">Community</h4>
              <p className="text-sm text-muted-foreground">
                Comment, rate, and engage with your team on technical topics.
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg">
              <Zap className="w-8 h-8 text-accent mb-4" />
              <h4 className="font-semibold mb-2">AI Powered</h4>
              <p className="text-sm text-muted-foreground">
                Get writing assistance, auto-tagging, and diagram generation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-accent text-accent-foreground">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to share your knowledge?</h3>
          <p className="text-lg mb-8 opacity-90">
            Join your team in building a comprehensive knowledge base.
          </p>
          {isAuthenticated ? (
            <Button asChild size="lg" variant="secondary">
              <Link href="/create">Start Writing</Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="secondary">
              <a href={getLoginUrl()}>Sign In to Get Started</a>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Engineering Knowledge Base. Built for teams.</p>
        </div>
      </footer>
    </div>
  );
}
