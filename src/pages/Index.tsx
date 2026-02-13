import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Search, 
  Clock, 
  Users, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';

const processSteps = [
  { step: '01', title: 'Register & Apply', desc: 'Create your account and submit your research application with all required documents.', icon: FileText },
  { step: '02', title: 'Review Process', desc: 'Your application is screened and reviewed by technical experts and data owners.', icon: Search },
  { step: '03', title: 'Approval Process', desc: 'The Ministry makes the final approval or rejection decision.', icon: CheckCircle },
  { step: '04', title: 'Conduct & Publish', desc: 'Complete your research and submit findings for repository publication.', icon: TrendingUp },
];

const formatCount = (value: number | null) => {
  if (value === null) return '—';
  return value.toLocaleString();
};

const formatDays = (value: number | null) => {
  if (value === null) return '—';
  return `${value} days`;
};

export default function Index() {
  const { data: statsData } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: async () => {
      try {
        const { SUPABASE_CONFIGURED } = await import("@/integrations/supabase/client");
        if (!SUPABASE_CONFIGURED) {
          return { approvedCount: null, partnerCount: 0, averageApprovalDays: null };
        }
      } catch (e) {
        return { approvedCount: null, partnerCount: 0, averageApprovalDays: null };
      }

      const { count: partnerCount, error: partnerError } = await supabase
        .from('partners')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (partnerError) {
        console.error('Partner stats error:', partnerError);
      }

      let averageApprovalDays: number | null = null;
      let approvedCount: number | null = null;
      try {
        const { data: decisions, error: decisionError } = await supabase
          .from('decisions')
          .select('application_id, decision_date')
          .eq('decision', 'APPROVED');

        if (decisionError) throw decisionError;

        approvedCount = decisions?.length ?? 0;

        const applicationIds = (decisions || []).map((row) => row.application_id).filter(Boolean);

        if (applicationIds.length > 0) {
          const { data: apps, error: appsError } = await supabase
            .from('applications')
            .select('id, created_at')
            .in('id', applicationIds);

          if (appsError) throw appsError;

          const createdMap = new Map(apps?.map((app) => [app.id, app.created_at]));
          const diffs = (decisions || [])
            .map((decision) => {
              const createdAt = createdMap.get(decision.application_id);
              if (!createdAt || !decision.decision_date) return null;
              const start = new Date(createdAt).getTime();
              const end = new Date(decision.decision_date).getTime();
              if (Number.isNaN(start) || Number.isNaN(end)) return null;
              return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
            })
            .filter((value): value is number => value !== null);

          if (diffs.length > 0) {
            averageApprovalDays = Math.round(diffs.reduce((sum, value) => sum + value, 0) / diffs.length);
          }
        }
      } catch (error) {
        console.error('Approval stats error:', error);
      }

      return {
        approvedCount,
        partnerCount: partnerCount ?? 0,
        averageApprovalDays,
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  const stats = [
    { value: formatCount(statsData?.approvedCount ?? null), label: 'Approved Studies', icon: CheckCircle },
    { value: formatDays(statsData?.averageApprovalDays ?? null), label: 'Avg. Approval Time', icon: Clock },
    { value: formatCount(statsData?.partnerCount ?? null), label: 'Research Partners', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background page-surface">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-gradient hero-surface text-primary-foreground relative overflow-hidden">
        <div className="container hero-content py-24 lg:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex justify-center">
              <span className="hero-badge">
                <Sparkles className="h-3.5 w-3.5" />
                Official Government Portal
              </span>
            </div>
            <div className="mb-8 flex justify-center">
              <div className="relative h-20 w-20 rounded-2xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
                <img
                  src="/correct - Coat of Arms.png"
                  alt="Coat of Arms"
                  className="h-14 w-14 object-contain drop-shadow-lg"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              Research Approval &{' '}
              <span className="text-accent">Repository</span>{' '}
              System
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/80 sm:text-xl max-w-2xl mx-auto leading-relaxed">
              The official platform for submitting, tracking, and accessing health research
              applications for the Ministry of Health.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg">
                <Link to="/auth?mode=signup">
                  Submit Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base h-12 px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm">
                <Link to="/repository">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Repository
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 text-sm text-primary-foreground/75 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-3">Secure, audited review workflow</div>
              <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-3">Transparent timelines and decisions</div>
              <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-3">National repository for approved studies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-12 z-10 pb-8">
        <div className="container">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="card-elevated border-0 shadow-xl bg-card/95 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="border-y section-tint py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our approval process ensures thorough review while maintaining efficiency.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {processSteps.map((item, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/20 hover:shadow-lg transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {item.step}
                  </div>
                  <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
                <img
                  src="/correct - Coat of Arms.png"
                  alt="Coat of Arms"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div>
                <p className="font-semibold">RARS</p>
                <p className="text-xs text-muted-foreground">Ministry of Health</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/repository" className="hover:text-foreground transition-colors">Repository</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">Help</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ministry of Health. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
