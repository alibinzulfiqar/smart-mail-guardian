import Link from 'next/link';
import { Shield, Mail, Lock, Zap, BarChart3, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">SmartMailGuardian</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Protect Your Inbox with{' '}
            <span className="text-primary">AI-Powered Security</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            SmartMailGuardian analyzes your emails in real-time to detect
            phishing, scams, malware, and social engineering attacks before they
            reach you.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                <Shield className="h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">99.9%</div>
            <div className="mt-2 text-muted-foreground">
              Threat Detection Rate
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{'<'}1s</div>
            <div className="mt-2 text-muted-foreground">Analysis Time</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">1M+</div>
            <div className="mt-2 text-muted-foreground">Emails Protected</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-center text-3xl font-bold">
          Enterprise-Grade Security for Everyone
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Mail className="h-10 w-10" />}
            title="Multi-Provider Support"
            description="Connect Gmail, Outlook, Yahoo, or any IMAP email provider. One dashboard for all your inboxes."
          />
          <FeatureCard
            icon={<Lock className="h-10 w-10" />}
            title="AI Threat Detection"
            description="Advanced machine learning models trained on millions of phishing emails to catch the latest threats."
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10" />}
            title="Real-Time Analysis"
            description="Emails are analyzed instantly as they arrive. Dangerous emails are quarantined automatically."
          />
          <FeatureCard
            icon={<BarChart3 className="h-10 w-10" />}
            title="Security Dashboard"
            description="Beautiful analytics showing your threat landscape, blocked attacks, and security trends."
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10" />}
            title="Link & Attachment Scanning"
            description="Every URL is expanded and checked. Attachments are scanned for malware and macros."
          />
          <FeatureCard
            icon={<CheckCircle className="h-10 w-10" />}
            title="Sender Verification"
            description="SPF, DKIM, and DMARC validation plus domain reputation and age checking."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">
            Ready to Secure Your Inbox?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Join thousands of users who trust SmartMailGuardian to protect their
            email.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 gap-2"
            >
              <Shield className="h-5 w-5" />
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">SmartMailGuardian</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SmartMailGuardian. All rights reserved.
          </p>
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
    <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="text-primary">{icon}</div>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
