import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import type { Application, Recommendation, Review } from "@/lib/types";

interface ReviewWithApplication extends Review {
  applications: Application;
}

export default function ReviewerAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ReviewWithApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Record<string, Recommendation>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  const fetchAssignments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, applications(*)")
        .eq("reviewer_id", user.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      setAssignments((data as unknown as ReviewWithApplication[]) || []);
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast({
        title: "Unable to load assignments",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const submitReview = async (review: ReviewWithApplication) => {
    const recommendation = recommendations[review.id];
    if (!recommendation) {
      toast({
        title: "Select a recommendation",
        description: "Please choose approve or reject.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          recommendation,
          comments: comments[review.id] || "",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", review.id);

      if (error) throw error;

      await supabase
        .from("applications")
        .update({ status: "ED_DECISION" })
        .eq("id", review.application_id);

      await logAudit({
        actorId: user?.id,
        entityType: "review",
        entityId: review.id,
        action: "SUBMIT_REVIEW",
        after: { recommendation },
      });

      toast({ title: "Review submitted" });
      fetchAssignments();
    } catch (submitError) {
      console.error("Review submission failed:", submitError);
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Review Assignments</h1>
          <p className="text-muted-foreground mt-2">
            Submit your recommendations for assigned applications.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-8 text-center text-muted-foreground">
              No assignments available.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {assignments.map((review) => (
              <Card key={review.id} className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-base">
                    {review.applications?.title || "Untitled Application"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Stage: {review.review_stage}
                  </div>
                  <div>
                    <Select
                      value={recommendations[review.id] || ""}
                      onValueChange={(value: Recommendation) =>
                        setRecommendations((prev) => ({ ...prev, [review.id]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Recommendation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPROVE">Approve</SelectItem>
                        <SelectItem value="REJECT">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Textarea
                      placeholder="Comments"
                      value={comments[review.id] || ""}
                      onChange={(event) =>
                        setComments((prev) => ({ ...prev, [review.id]: event.target.value }))
                      }
                    />
                  </div>
                  <Button onClick={() => submitReview(review)}>Submit Review</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
