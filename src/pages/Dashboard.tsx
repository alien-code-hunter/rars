import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/lib/types';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Send,
  ArrowRight,
  Users,
  Settings,
  Clipboard,
  BookOpen,
  TrendingUp
} from 'lucide-react';

const statusGroups = {
  draft: ['DRAFT', 'RETURNED'] as ApplicationStatus[],
  pending: ['SUBMITTED', 'SCREENING', 'IN_REVIEW', 'ED_DECISION'] as ApplicationStatus[],
  approved: ['APPROVED', 'ACTIVE_RESEARCH', 'FINAL_SUBMISSION_PENDING'] as ApplicationStatus[],
  completed: ['COMPLETED', 'PUBLISHED'] as ApplicationStatus[],
  rejected: ['REJECTED'] as ApplicationStatus[],
};

export default function Dashboard() {
  const { user, profile, roles, loading: authLoading } = useAuth();
  const { isStaff } = useAppPermissions();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusSnapshot, setStatusSnapshot] = useState<ApplicationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchApplications = useCallback(async () => {
    const fetchWithRetry = async (attempt = 1): Promise<void> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('applications')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) {
        if (attempt < 3) {
          const delay = 500 * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(attempt + 1);
        }
        throw error;
      }

      setApplications((data as unknown as Application[]) || []);
      setTotalCount(count ?? 0);

      const { data: statusData, error: statusError } = await supabase
        .from('applications')
        .select('status');

      if (statusError) {
        throw statusError;
      }

      setStatusSnapshot(
        ((statusData as { status: ApplicationStatus }[]) || []).map((item) => item.status)
      );
    };

    try {
      setLoading(true);
      await fetchWithRetry();
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Unable to load applications',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  const counts = useMemo(() => {
    return {
      draft: statusSnapshot.filter(status => statusGroups.draft.includes(status)).length,
      pending: statusSnapshot.filter(status => statusGroups.pending.includes(status)).length,
      approved: statusSnapshot.filter(status => statusGroups.approved.includes(status)).length,
      completed: statusSnapshot.filter(status => statusGroups.completed.includes(status)).length,
      rejected: statusSnapshot.filter(status => statusGroups.rejected.includes(status)).length,
    };
  }, [statusSnapshot]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Role-based dashboard routing
  if (isStaff()) {
    return <StaffDashboard />;
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Skeleton className="h-32 mb-6" />
          <div className="grid gap-4 md:grid-cols-5 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Drafts', count: counts.draft, icon: Edit, color: 'text-muted-foreground', bgColor: 'bg-muted', borderColor: 'border-l-muted-foreground' },
    { label: 'Pending Review', count: counts.pending, icon: Clock, color: 'text-info', bgColor: 'bg-info/10', borderColor: 'border-l-info' },
    { label: 'Approved', count: counts.approved, icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-l-success' },
    { label: 'Completed', count: counts.completed, icon: FileText, color: 'text-accent', bgColor: 'bg-accent/10', borderColor: 'border-l-accent' },
    { label: 'Rejected', count: counts.rejected, icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-l-destructive' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero banner */}
      <section className="hero-gradient hero-surface text-primary-foreground">
        <div className="container hero-content py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="hero-badge mb-3 w-fit">
                <CheckCircle className="h-3.5 w-3.5" />
                Applicant Dashboard
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">Welcome, {profile?.full_name || 'Applicant'}</h1>
              <p className="mt-2 text-primary-foreground/70">
                Manage your research applications and track their progress.
              </p>
            </div>
            <Button asChild variant="secondary" className="h-11 px-6 shadow-lg">
              <Link to="/applications/new">
                <Plus className="mr-2 h-4 w-4" />
                New Application
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <div className="container py-8">
        {!profile?.full_name && (
          <Card className="mb-6 border border-warning/40 bg-warning/5">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Complete your profile</p>
                <p className="text-xs text-muted-foreground">
                  Add your full name so it appears on your applications and reviewer documents.
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/profile">Add full name</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-8">
          {statCards.map((stat, index) => (
            <Card 
              key={stat.label} 
              className={`border border-border/50 border-l-4 ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow animate-slide-up`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{stat.count}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Applications List */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Your Applications</CardTitle>
                <CardDescription>View and manage all your research applications</CardDescription>
              </div>
              <span className="text-sm text-muted-foreground font-mono">{totalCount} total</span>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
                  <FileText className="h-8 w-8 text-primary/40" />
                </div>
                <h3 className="text-lg font-semibold">No applications yet</h3>
                <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                  Start by creating your first research application to get approval.
                </p>
                <Button asChild className="mt-6 h-11">
                  <Link to="/applications/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Application
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:shadow-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <StatusBadge status={app.status} />
                        <span className="text-xs text-muted-foreground font-mono">
                          {app.reference_number}
                        </span>
                      </div>
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {app.title || 'Untitled Application'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last updated: {formatDate(app.updated_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {app.status === 'DRAFT' || app.status === 'RETURNED' ? (
                        <Button variant="outline" size="sm" asChild className="h-9">
                          <Link to={`/applications/${app.id}/edit`}>
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" asChild className="h-9">
                          <Link to={`/applications/${app.id}`}>
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                      )}
                      {['APPROVED', 'ACTIVE_RESEARCH'].includes(app.status) && (
                        <Button variant="outline" size="sm" asChild className="h-9">
                          <Link to="/extensions">Request Extension</Link>
                        </Button>
                      )}
                      {['APPROVED', 'ACTIVE_RESEARCH', 'FINAL_SUBMISSION_PENDING'].includes(app.status) && (
                        <Button size="sm" asChild className="h-9">
                          <Link to={`/final-submission/${app.id}`}>
                            Upload Final
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {totalCount > pageSize && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Staff Dashboard
function StaffDashboard() {
  const { roles, profile } = useAuth();
  
  const getRoleTitle = () => {
    if (roles.includes('SYSTEM_ADMIN')) return 'System Administrator';
    if (roles.includes('EXECUTIVE_DIRECTOR')) return 'Executive Director';
    if (roles.includes('ADMIN_OFFICER')) return 'Admin Officer';
    if (roles.includes('REVIEWER')) return 'Reviewer';
    return 'Staff';
  };

  const staffCards = [
    ...(roles.includes('ADMIN_OFFICER') ? [
      { title: 'Screening Queue', desc: 'Applications awaiting screening', icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', link: '/screening', action: 'View Queue' },
      { title: 'Assign Reviewers', desc: 'Route applications to reviewers', icon: Send, color: 'text-info', bgColor: 'bg-info/10', link: '/assign', action: 'Assign' },
      { title: 'Closure Queue', desc: 'Publish final submissions', icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10', link: '/closures', action: 'Open' },
      { title: 'Repository Analytics', desc: 'Views, downloads, and trends', icon: TrendingUp, color: 'text-success', bgColor: 'bg-success/10', link: '/admin/analytics', action: 'View Analytics' },
    ] : []),
    ...(roles.includes('REVIEWER') ? [
      { title: 'My Assignments', desc: 'Applications assigned for review', icon: Clipboard, color: 'text-primary', bgColor: 'bg-primary/10', link: '/reviews', action: 'View Assignments' },
    ] : []),
    ...(roles.includes('EXECUTIVE_DIRECTOR') ? [
      { title: 'Pending Decisions', desc: 'Applications awaiting your decision', icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', link: '/decisions', action: 'Review' },
    ] : []),
    ...(roles.includes('SYSTEM_ADMIN') ? [
      { title: 'User Management', desc: 'Manage users and roles', icon: Users, color: 'text-accent', bgColor: 'bg-accent/10', link: '/admin/users', action: 'Manage Users' },
      { title: 'System Settings', desc: 'Configure system settings', icon: Settings, color: 'text-muted-foreground', bgColor: 'bg-muted', link: '/admin', action: 'Settings' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="hero-gradient hero-surface text-primary-foreground">
        <div className="container hero-content py-10">
          <div>
            <div className="hero-badge mb-3 w-fit">
              <CheckCircle className="h-3.5 w-3.5" />
              Staff Workspace
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">{getRoleTitle()} Dashboard</h1>
            <p className="mt-2 text-primary-foreground/70">
              Welcome back, {profile?.full_name}
            </p>
          </div>
        </div>
      </section>
      
      <div className="container py-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {staffCards.map((card, index) => (
            <Card 
              key={card.title} 
              className="group border border-border/50 shadow-sm hover:border-primary/20 hover:shadow-xl transition-all duration-500 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <CardDescription className="text-xs">{card.desc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full h-10">
                  <Link to={card.link}>
                    {card.action}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
