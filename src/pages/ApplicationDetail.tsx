import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Application, Document, DocumentDownload, Message, Review } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [downloadStats, setDownloadStats] = useState<Record<string, { count: number; last?: string }>>({});
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    const { data: appData } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

    setApplication((appData as unknown as Application) || null);

    const { data: docData } = await supabase
      .from("documents")
      .select("*")
      .eq("application_id", id)
      .order("uploaded_at", { ascending: false });

    setDocuments((docData as unknown as Document[]) || []);

    const docIds = (docData as Document[] | null)?.map((doc) => doc.id) || [];
    if (docIds.length > 0) {
      const { data: downloadData } = await supabase
        .from("document_downloads")
        .select("document_id, created_at")
        .in("document_id", docIds);

      const stats: Record<string, { count: number; last?: string }> = {};
      (downloadData as DocumentDownload[] | null)?.forEach((entry) => {
        const current = stats[entry.document_id] || { count: 0, last: undefined };
        const last = current.last && new Date(current.last) > new Date(entry.created_at)
          ? current.last
          : entry.created_at;
        stats[entry.document_id] = { count: current.count + 1, last };
      });
      setDownloadStats(stats);
    }

    const { data: msgData } = await supabase
      .from("messages")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: true });

    setMessages((msgData as unknown as Message[]) || []);

    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*")
      .eq("application_id", id)
      .order("assigned_at", { ascending: false });

    setReviews((reviewData as unknown as Review[]) || []);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !attachment) || !user || !id) return;

    let attachmentMarker = "";
    if (attachment) {
      const filePath = `${user.id}/${id}/messages/${Date.now()}_${attachment.name}`;
      const { error: uploadError } = await supabase.storage
        .from("research-documents")
        .upload(filePath, attachment, { upsert: false });

      if (uploadError) {
        toast({
          title: "Attachment upload failed",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      await supabase.from("documents").insert({
        application_id: id,
        document_type: "OTHER",
        file_name: attachment.name,
        file_path: filePath,
        mime_type: attachment.type,
        size_bytes: attachment.size,
        uploaded_by: user.id,
      });

      attachmentMarker = `\n[attachment:${filePath}:${attachment.name}]`;
    }

    const { error } = await supabase.from("messages").insert({
      application_id: id,
      sender_id: user.id,
      message_text: `${newMessage}${attachmentMarker}`.trim(),
    });

    if (error) {
      toast({
        title: "Message failed",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
    setAttachment(null);
    fetchData();
  };

  const parseAttachment = (text: string) => {
    const match = text.match(/\[attachment:(.+?):(.+?)\]/);
    if (!match) return { message: text, attachment: null };
    return {
      message: text.replace(match[0], "").trim(),
      attachment: { path: match[1], name: match[2] },
    };
  };

  const downloadAttachment = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("research-documents")
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      toast({
        title: "Download failed",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const downloadDocument = async (doc: Document) => {
    const { data, error } = await supabase.storage
      .from("research-documents")
      .createSignedUrl(doc.file_path, 60);

    if (error || !data?.signedUrl) {
      toast({
        title: "Download failed",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    await supabase.from("document_downloads").insert({
      document_id: doc.id,
      user_id: user?.id ?? null,
      action: "DOWNLOAD",
    });

    setDownloadStats((prev) => {
      const current = prev[doc.id] || { count: 0, last: undefined };
      return {
        ...prev,
        [doc.id]: { count: current.count + 1, last: new Date().toISOString() },
      };
    });

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Application Detail</h1>
          <p className="text-muted-foreground mt-2">
            {application?.title || "Untitled application"}
          </p>
        </div>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Overview</CardTitle>
            {application?.status && <StatusBadge status={application.status} />}
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Reference: {application?.reference_number}</p>
            <p className="text-sm">Submitted: {formatDate(application?.created_at)}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="documents" className="mt-6">
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <Card className="card-elevated">
              <CardContent className="space-y-3 pt-6">
                {documents.length === 0 ? (
                  <p className="text-muted-foreground">No documents uploaded.</p>
                ) : (
                  Object.entries(
                    documents.reduce<Record<string, Document[]>>((acc, doc) => {
                      acc[doc.document_type] = acc[doc.document_type] || [];
                      acc[doc.document_type].push(doc);
                      return acc;
                    }, {})
                  ).map(([type, docs]) => (
                    <div key={type} className="space-y-2">
                      <p className="text-sm font-semibold">{type.replace("_", " ")}</p>
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Version {doc.version} · {formatDate(doc.uploaded_at)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Downloads: {downloadStats[doc.id]?.count || 0}
                              {downloadStats[doc.id]?.last ? ` · Last ${formatDate(downloadStats[doc.id].last)}` : ""}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => downloadDocument(doc)}>
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="card-elevated">
              <CardContent className="space-y-3 pt-6">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews submitted.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border border-border/60 rounded-lg p-3">
                      <p className="text-sm">Stage: {review.review_stage}</p>
                      <p className="text-sm">Recommendation: {review.recommendation || "Pending"}</p>
                      {review.comments && (
                        <p className="text-sm text-muted-foreground">{review.comments}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="card-elevated">
              <CardContent className="space-y-3 pt-6">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground">No messages yet.</p>
                ) : (
                  messages.map((msg) => {
                    const parsed = parseAttachment(msg.message_text);
                    return (
                      <div key={msg.id} className="border border-border/60 rounded-lg p-3">
                        <p className="text-sm">{parsed.message || "Attachment"}</p>
                        {parsed.attachment && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => downloadAttachment(parsed.attachment.path)}
                          >
                            Download {parsed.attachment.name}
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">{formatDate(msg.created_at)}</p>
                      </div>
                    );
                  })
                )}

                <div className="pt-4">
                  <Textarea
                    placeholder="Write a message"
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                  />
                  <Input
                    type="file"
                    className="mt-3"
                    onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                  />
                  <Button className="mt-3" onClick={sendMessage}>
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
