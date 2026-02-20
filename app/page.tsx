import Link from "next/link";
import { Users, Shield, Brain, Clock, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Roommate Finder 3000</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Student Login
            </Link>
            <Link
              href="/admin/login"
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-8">
            <span>Smart Roommate Matching</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Find Your Perfect
            <br />
            <span className="text-primary">Roommate Match</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A compatibility-driven platform that helps organizations match
            students with their ideal roommates based on lifestyle, habits, and
            personality.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/claim"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Claim Your Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Organization-Gated"
              description="Profiles are pre-created by your organization. Claim yours to get started — no fake accounts."
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="Smart Matching"
              description="Our compatibility algorithm considers sleep schedules, cleanliness, noise tolerance, and more."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Mutual Selection"
              description="Send and receive roommate requests. Rooms form automatically when matches are mutual."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Deadline-Aware"
              description="The system respects real room inventory and deadlines, auto-assigning anyone left unmatched."
            />
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-card border rounded-2xl p-10 text-center">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <Step
                number="1"
                title="Claim & Set Up"
                description="Your org creates your profile. Claim it, pick a room size, and complete the lifestyle survey."
              />
              <Step
                number="2"
                title="Discover Matches"
                description="Browse ranked compatible roommates, read bios, and see why you match."
              />
              <Step
                number="3"
                title="Form Your Room"
                description="Send requests, get endorsed by room members, and lock in your group before the deadline."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          Roommate Finder 3000 &mdash; Built for better living together.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
