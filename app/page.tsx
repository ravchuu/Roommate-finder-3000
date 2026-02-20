import Link from "next/link";
import { Users, Shield, Brain, Clock, ArrowRight, Leaf } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-mint/40 via-background to-pastel-teal/30">
      <nav className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
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
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pastel-teal/60 text-primary rounded-full text-sm font-medium mb-8">
            <Leaf className="h-3.5 w-3.5" />
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              Claim Your Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-white/50 rounded-xl font-medium hover:bg-white/80 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Organization-Gated"
              description="Profiles are pre-created by your organization. Claim yours to get started — no fake accounts."
              color="bg-pastel-teal/40 border-pastel-teal"
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="Smart Matching"
              description="Our compatibility algorithm considers sleep schedules, cleanliness, noise tolerance, and more."
              color="bg-pastel-lavender/40 border-pastel-lavender"
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Mutual Selection"
              description="Send and receive roommate requests. Rooms form automatically when matches are mutual."
              color="bg-pastel-peach/40 border-pastel-peach"
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Deadline-Aware"
              description="The system respects real room inventory and deadlines, auto-assigning anyone left unmatched."
              color="bg-pastel-sky/40 border-pastel-sky"
            />
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white/60 border border-border/60 rounded-3xl p-10 text-center backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <Step
                number="1"
                title="Claim & Set Up"
                description="Your org creates your profile. Claim it, pick a room size, and complete the lifestyle survey."
                color="bg-pastel-green"
              />
              <Step
                number="2"
                title="Discover Matches"
                description="Browse ranked compatible roommates, read bios, and see why you match."
                color="bg-pastel-peach"
              />
              <Step
                number="3"
                title="Form Your Room"
                description="Send requests, get endorsed by room members, and lock in your group before the deadline."
                color="bg-pastel-sky"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
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
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 hover:shadow-md transition-all ${color}`}
    >
      <div className="h-11 w-11 rounded-xl bg-white/60 text-primary flex items-center justify-center mb-4">
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
  color,
}: {
  number: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div>
      <div
        className={`h-11 w-11 rounded-2xl ${color} text-primary flex items-center justify-center font-bold mx-auto mb-4 text-lg`}
      >
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
