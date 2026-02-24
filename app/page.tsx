import Link from "next/link";
import { Users, Shield, Brain, Clock, ArrowRight, Leaf, Upload, Settings2, BarChart3 } from "lucide-react";

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
          <div className="bg-white/60 border border-border/60 rounded-3xl p-10 text-center backdrop-blur-sm">
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
                accent
              />
              <Step
                number="3"
                title="Form Your Room"
                description="Send requests, get endorsed by room members, and lock in your group before the deadline."
              />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-pastel-teal/30 to-pastel-mint/30 border border-pastel-teal/60 rounded-3xl p-10">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">For administrators</h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Set up your organization’s rooming process in three steps: upload your student roster, set your rooming standards, then monitor matching and finalize.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <AdminStep
                icon={<Upload className="h-5 w-5" />}
                step="1"
                title="Upload roster"
                description="Import students via CSV (name, email). Students get claim links to join the platform."
              />
              <AdminStep
                icon={<Settings2 className="h-5 w-5" />}
                step="2"
                title="Set rooming standards"
                description="Choose deadline, housing type (co-ed or single gender), and room sizes and counts."
              />
              <AdminStep
                icon={<BarChart3 className="h-5 w-5" />}
                step="3"
                title="Monitor & finalize"
                description="Track claims and groups on the dashboard. Lock and auto-assign when ready."
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Shield className="h-4 w-4" />
                Go to Admin
              </Link>
              <Link
                href="/admin/setup"
                className="inline-flex items-center gap-2 px-6 py-3 border border-pastel-teal bg-white/70 rounded-xl font-medium hover:bg-white transition-colors"
              >
                First-time admin? Create your organization
              </Link>
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-pastel-teal/60 bg-pastel-teal/25 p-6 hover:bg-pastel-teal/40 hover:shadow-md transition-all">
      <div className="h-11 w-11 rounded-xl bg-pastel-teal/60 text-primary flex items-center justify-center mb-4">
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
  accent,
}: {
  number: string;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={`h-11 w-11 rounded-2xl ${accent ? "bg-pastel-peach" : "bg-pastel-teal"} text-primary flex items-center justify-center font-bold mx-auto mb-4 text-lg`}
      >
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function AdminStep({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-pastel-teal/60 bg-white/70 p-5 text-left">
      <div className="h-10 w-10 rounded-xl bg-pastel-teal/60 text-primary flex items-center justify-center mb-3">
        {icon}
      </div>
      <span className="text-xs font-semibold text-primary uppercase tracking-wide">Step {step}</span>
      <h3 className="font-semibold mt-1 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
