import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Application, Document, RepositoryItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Download, Globe, Lock, FileText, Tag } from "lucide-react";

interface RepositoryItemWithApplication extends RepositoryItem {
  applications: Application;
}

export default function RepositoryDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState<RepositoryItemWithApplication | null>(null);
  const [finalDoc, setFinalDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [relatedItems, setRelatedItems] = useState<RepositoryItemWithApplication[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("repository_items")
          .select("*, applications(*)")
          .eq("id", id)
          .single();

        if (error) throw error;
        const nextItem = data as unknown as RepositoryItemWithApplication;
        setItem(nextItem);

        const keywords = (nextItem.keywords as string[]) || [];
        let relatedQuery = supabase
          .from("repository_items")
          .select("*, applications(*)")
          .neq("id", nextItem.id)
          .eq("public_visible", true)
          .limit(6);

        if (keywords.length > 0) {
          relatedQuery = relatedQuery.contains("keywords", [keywords[0]]);
        } else if (nextItem.program_area) {
          relatedQuery = relatedQuery.eq("program_area", nextItem.program_area);
        }

        const { data: relatedData } = await relatedQuery;
        setRelatedItems((relatedData as unknown as RepositoryItemWithApplication[]) || []);
      } catch (err) {
        console.error("Error loading repository item:", err);
        toast({
          title: "Unable to load item",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!item) return;
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("application_id", item.application_id)
        .eq("document_type", "FINAL_PAPER")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching final paper:", error);
        return;
      }

      setFinalDoc((data as unknown as Document) || null);
    };

    fetchDocument();
  }, [item]);

  useEffect(() => {
    if (!item) return;
    supabase.from("access_logs").insert({
      repository_item_id: item.id,
      user_id: user?.id ?? null,
      action: "VIEW",
      terms_accepted: termsAccepted,
    });
  }, [item, user?.id, termsAccepted]);

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!item || !user) {
        setIsTracking(false);
        return;
      }

      const { data } = await supabase
        .from("repository_watchlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("repository_item_id", item.id)
        .maybeSingle();

      setIsTracking(Boolean(data?.id));
    };

    checkWatchlist();
  }, [item?.id, user?.id]);

  const canDownload = useMemo(() => {
    if (!item) return false;
    if (!item.restricted) return true;
    if (!user) return false;
    return termsAccepted;
  }, [item, user, termsAccepted]);

  const handleDownload = async () => {
    if (!item || !finalDoc) return;

    if (item.restricted && !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to request access to restricted content.",
        variant: "destructive",
      });
      return;
    }

    if (item.restricted && !termsAccepted) {
      toast({
        title: "Accept terms to continue",
        description: "Please accept the terms of use before downloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("research-documents")
        .createSignedUrl(finalDoc.file_path, 60);

      if (error) throw error;

      await supabase.from("access_logs").insert({
        repository_item_id: item.id,
        user_id: user?.id ?? null,
        action: "DOWNLOAD",
        terms_accepted: termsAccepted,
      });

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (downloadErr) {
      console.error("Download failed:", downloadErr);
      toast({
        title: "Download failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const toggleWatchlist = async () => {
    if (!item || !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to track research.",
        variant: "destructive",
      });
      return;
    }

    if (isTracking) {
      await supabase
        .from("repository_watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("repository_item_id", item.id);
      setIsTracking(false);
      toast({ title: "Removed from tracked research" });
    } else {
      await supabase.from("repository_watchlist").insert({
        user_id: user.id,
        repository_item_id: item.id,
      });
      setIsTracking(true);
      toast({ title: "Added to tracked research" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Skeleton className="h-10 w-1/2 mb-6" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-xl font-semibold">Item not found</h2>
          <Button asChild className="mt-6">
            <Link to="/repository">Back to Repository</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="hero-gradient hero-surface text-primary-foreground">
        <div className="container hero-content py-10">
          <div className="max-w-3xl">
            <Badge variant={item.restricted ? "destructive" : "secondary"}>
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
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              {item.applications?.title || "Untitled Research"}
            </h1>
            <p className="mt-3 text-primary-foreground/80">
              {item.applications?.abstract || "No abstract available."}
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Study Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Institution</p>
                <p className="font-medium">{item.institution || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="font-medium">{formatDate(item.published_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data type</p>
                <p className="font-medium">{item.applications?.data_type || ""}</p>
              </div>
              {(item.keywords as string[])?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {(item.keywords as string[]).map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        <Tag className="mr-1 h-3 w-3" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.restricted && (
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
                    />
                    <div>
                      <p className="text-sm font-medium">Accept repository terms</p>
                      <p className="text-xs text-muted-foreground">
                        You agree to the ministry terms for restricted research access.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleDownload}
                disabled={!finalDoc || !canDownload}
                variant={item.restricted ? "outline" : "default"}
              >
                <Download className="mr-2 h-4 w-4" />
                {item.restricted ? "Request Access" : "View & Download"}
              </Button>

              {!user && item.restricted && (
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/auth">Sign in to access</Link>
                </Button>
              )}

              <Button
                className="w-full"
                variant="outline"
                onClick={toggleWatchlist}
              >
                {isTracking ? "Untrack research" : "Track research"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {relatedItems.length > 0 && (
        <div className="container pb-12">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Related Studies</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatedItems.map((related) => (
                <Card key={related.id} className="border border-border/60">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium line-clamp-2">
                      {related.applications?.title || "Untitled Research"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {related.institution || ""}
                    </p>
                    <Button asChild variant="link" className="px-0">
                      <Link to={`/repository/${related.id}`}>View</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
