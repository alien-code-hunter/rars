import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { useFilters } from '@/hooks/use-filters';
import { toast } from '@/hooks/use-toast';
import type { RepositoryItem, Application } from '@/lib/types';
import {
  Search,
  Download,
  Lock,
  Globe,
  Calendar,
  Building,
  Tag,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface RepositoryItemWithApplication extends RepositoryItem {
  applications: Application;
}

export default function Repository() {
  const { filters, setFilter } = useFilters();
  const debouncedQuery = useDebounce(filters.query, 400);

  const fetchRepositoryItems = async () => {
    let query = supabase
      .from('repository_items')
      .select(`
        *,
        applications (*)
      `)
      .eq('public_visible', true);

    if (debouncedQuery) {
      query = query.or(
        `title.ilike.%${debouncedQuery}%,abstract.ilike.%${debouncedQuery}%`,
        { foreignTable: 'applications' }
      );
      query = query.or(`keywords.cs.{${debouncedQuery}}`);
    }

    if (filters.year !== 'all') {
      query = query.eq('publication_year', Number(filters.year));
    }

    if (filters.institution !== 'all') {
      query = query.eq('institution', filters.institution);
    }

    if (filters.sort === 'oldest') {
      query = query.order('published_at', { ascending: true });
    } else if (filters.sort === 'title-asc') {
      query = query.order('title', { ascending: true, foreignTable: 'applications' });
    } else if (filters.sort === 'title-desc') {
      query = query.order('title', { ascending: false, foreignTable: 'applications' });
    } else {
      query = query.order('published_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as RepositoryItemWithApplication[]) || [];
  };

  const { data: items = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['repository-items', debouncedQuery, filters.year, filters.institution, filters.sort],
    queryFn: fetchRepositoryItems,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  if (queryError) {
    console.error('Error fetching repository items:', queryError);
  }

  const years = useMemo(
    () => [...new Set(items.map((i: RepositoryItemWithApplication) => i.publication_year).filter(Boolean) as number[])].sort((a, b) => b - a),
    [items]
  );
  const institutions = useMemo(
    () => [...new Set(items.map((i: RepositoryItemWithApplication) => i.institution).filter(Boolean) as string[])],
    [items]
  );
 
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-gradient hero-surface text-primary-foreground">
        <div className="container hero-content py-12">
          <div className="max-w-2xl">
            <div className="hero-badge mb-4 w-fit">
              <Globe className="h-3.5 w-3.5" />
              Public research library
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">Research Repository</h1>
            <p className="mt-3 text-primary-foreground/75 text-lg leading-relaxed">
              Access published research findings, datasets, and reports from approved health research studies.
            </p>
          </div>
        </div>
      </section>
 
      {/* Search and Filters */}
      <section className="border-b bg-card py-6">
        <div className="container">
          <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, abstract, or keywords..."
                value={filters.query}
                onChange={(e) => setFilter('query', e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters:</span>
              </div>
              <Select value={filters.year} onValueChange={(value) => setFilter('year', value)}>
                <SelectTrigger className="w-[130px] h-10">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year: number) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.institution} onValueChange={(value) => setFilter('institution', value)}>
                <SelectTrigger className="w-[170px] h-10">
                  <Building className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map((inst: string) => (
                    <SelectItem key={inst} value={inst}>
                      {inst}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.sort} onValueChange={(value) => setFilter('sort', value)}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title-asc">Title A–Z</SelectItem>
                  <SelectItem value="title-desc">Title Z–A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
 
       {/* Results */}
       <section className="py-8">
         <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {items.length} research {items.length === 1 ? 'item' : 'items'} found
            </p>
          </div>
 
           {loading ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {[1, 2, 3, 4, 5, 6].map(i => (
                 <Skeleton key={i} className="h-72 rounded-xl" />
               ))}
             </div>
          ) : items.length === 0 ? (
             <div className="text-center py-20">
               <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                 <FileText className="h-8 w-8 text-muted-foreground/50" />
               </div>
               <h3 className="text-xl font-semibold">No research found</h3>
               <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                {filters.query || filters.year !== 'all' || filters.institution !== 'all'
                   ? 'Try adjusting your search or filters.'
                   : 'No research has been published to the repository yet.'}
               </p>
             </div>
           ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item: RepositoryItemWithApplication) => {
                const keywords = Array.isArray(item.keywords) ? (item.keywords as string[]) : [];
                return (
                  <Card 
                    key={item.id} 
                    className="group flex flex-col border border-border/50 hover:border-primary/20 hover:shadow-xl transition-all duration-500 animate-fade-in"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={item.restricted ? "destructive" : "secondary"} className="text-[11px]">
                          {item.restricted ? (
                            <>
                              <Lock className="mr-1 h-3 w-3" />
                              Restricted
                            </>
                          ) : (
                            <>
                              <Globe className="mr-1 h-3 w-3" />
                              Public
                            </>
                          )}
                        </Badge>
                        {item.publication_year && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.publication_year}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2 mt-3 group-hover:text-primary transition-colors">
                        {item.applications?.title || 'Untitled Research'}
                      </CardTitle>
                      {item.institution && (
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                          <Building className="h-3 w-3" />
                          {item.institution}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {item.applications?.abstract || 'No abstract available.'}
                      </p>
                      
                      {keywords.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {keywords.slice(0, 3).map((keyword: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-normal">
                              <Tag className="mr-1 h-2 w-2" />
                              {keyword}
                            </Badge>
                          ))}
                          {keywords.length > 3 && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              +{keywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <div className="p-6 pt-0">
                      <Button asChild className="w-full h-10" variant={item.restricted ? "outline" : "default"}>
                        <Link to={`/repository/${item.id}`}>
                          {item.restricted ? (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Request Access
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              View & Download
                            </>
                          )}
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
           )}
         </div>
       </section>
     </div>
   );
 }
