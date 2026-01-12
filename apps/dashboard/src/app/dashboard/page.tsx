'use client';

import {
  Shield,
  Mail,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn, formatRelativeTime, getRiskColor, getRiskBgColor } from '@/lib/utils';

// Mock data - replace with API calls
const stats = {
  totalEmails: 1247,
  threatsBlocked: 23,
  safeEmails: 1189,
  suspiciousEmails: 35,
  dangerousEmails: 23,
  lastSync: new Date(Date.now() - 1000 * 60 * 5),
};

const recentThreats = [
  {
    id: '1',
    subject: 'URGENT: Verify your account immediately',
    sender: 'support@bankk-secure.com',
    riskLevel: 'dangerous',
    riskScore: 95,
    receivedAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '2',
    subject: 'Invoice #INV-2024-0892 - Payment Required',
    sender: 'invoice@supplier-invoices.net',
    riskLevel: 'suspicious',
    riskScore: 65,
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '3',
    subject: 'Confidential: Wire Transfer Request',
    sender: 'ceo@company-executives.org',
    riskLevel: 'dangerous',
    riskScore: 88,
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
];

const threatTypes = [
  { type: 'Phishing', count: 12, percentage: 52 },
  { type: 'Social Engineering', count: 5, percentage: 22 },
  { type: 'Malware', count: 3, percentage: 13 },
  { type: 'Spam', count: 3, percentage: 13 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your email security in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last sync: {formatRelativeTime(stats.lastSync)}
          </span>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Emails"
          value={stats.totalEmails.toLocaleString()}
          description="Emails scanned"
          icon={Mail}
          trend="+12% from last week"
        />
        <StatCard
          title="Threats Blocked"
          value={stats.threatsBlocked.toString()}
          description="Dangerous emails quarantined"
          icon={Shield}
          iconColor="text-red-500"
          trend="23 attacks prevented"
        />
        <StatCard
          title="Safe Emails"
          value={stats.safeEmails.toLocaleString()}
          description="Clean emails delivered"
          icon={ShieldCheck}
          iconColor="text-green-500"
          trend="95% safe rate"
        />
        <StatCard
          title="Detection Rate"
          value="99.9%"
          description="AI accuracy score"
          icon={TrendingUp}
          iconColor="text-blue-500"
          trend="Industry leading"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Threats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Recent Threats
            </CardTitle>
            <CardDescription>
              Latest detected security threats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentThreats.map((threat) => (
                <div
                  key={threat.id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div
                    className={cn(
                      'mt-1 h-3 w-3 rounded-full',
                      threat.riskLevel === 'dangerous'
                        ? 'bg-red-500'
                        : 'bg-orange-500'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{threat.subject}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {threat.sender}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          getRiskBgColor(threat.riskLevel),
                          getRiskColor(threat.riskLevel)
                        )}
                      >
                        {threat.riskLevel.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Score: {threat.riskScore}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(threat.receivedAt)}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" className="mt-4 w-full">
              View all threats →
            </Button>
          </CardContent>
        </Card>

        {/* Threat Types */}
        <Card>
          <CardHeader>
            <CardTitle>Threat Distribution</CardTitle>
            <CardDescription>
              Breakdown of detected threat types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threatTypes.map((threat) => (
                <div key={threat.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{threat.type}</span>
                    <span className="text-muted-foreground">
                      {threat.count} ({threat.percentage}%)
                    </span>
                  </div>
                  <Progress value={threat.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Security Score</CardTitle>
          <CardDescription>
            Based on your email security posture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth="3"
                  strokeDasharray="92, 100"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">92</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-green-500">Excellent</h3>
              <p className="text-muted-foreground max-w-md">
                Your email security is strong. Keep monitoring for new threats
                and ensure all connected mailboxes are properly configured.
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  2 mailboxes connected and secured
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  AI analysis enabled for all emails
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Real-time threat notifications active
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
