import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface PartnerRow {
  id: string;
  name: string;
  country: string;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const normalizeField = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export default function AdminPartners() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [editName, setEditName] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("partners").select("*").order("name");
    setLoading(false);

    if (error) {
      toast({
        title: "Failed to load partners",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setPartners((data as PartnerRow[]) || []);
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const resetCreateForm = () => {
    setName("");
    setCountry("");
    setDescription("");
    setWebsite("");
    setLogoUrl("");
    setContactEmail("");
    setContactPhone("");
  };

  const createPartner = async () => {
    if (!name.trim() || !country.trim()) {
      toast({
        title: "Missing details",
        description: "Name and country are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("partners").insert({
      name: name.trim(),
      country: country.trim(),
      description: normalizeField(description),
      website: normalizeField(website),
      logo_url: normalizeField(logoUrl),
      contact_email: normalizeField(contactEmail),
      contact_phone: normalizeField(contactPhone),
    });
    setSaving(false);

    if (error) {
      toast({
        title: "Create failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Partner added" });
    resetCreateForm();
    fetchPartners();
  };

  const startEdit = (partner: PartnerRow) => {
    setEditId(partner.id);
    setEditName(partner.name);
    setEditCountry(partner.country);
    setEditDescription(partner.description ?? "");
    setEditWebsite(partner.website ?? "");
    setEditLogoUrl(partner.logo_url ?? "");
    setEditContactEmail(partner.contact_email ?? "");
    setEditContactPhone(partner.contact_phone ?? "");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditCountry("");
    setEditDescription("");
    setEditWebsite("");
    setEditLogoUrl("");
    setEditContactEmail("");
    setEditContactPhone("");
  };

  const saveEdit = async () => {
    if (!editId) return;

    if (!editName.trim() || !editCountry.trim()) {
      toast({
        title: "Missing details",
        description: "Name and country are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("partners")
      .update({
        name: editName.trim(),
        country: editCountry.trim(),
        description: normalizeField(editDescription),
        website: normalizeField(editWebsite),
        logo_url: normalizeField(editLogoUrl),
        contact_email: normalizeField(editContactEmail),
        contact_phone: normalizeField(editContactPhone),
      })
      .eq("id", editId);
    setSaving(false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Partner updated" });
    cancelEdit();
    fetchPartners();
  };

  const toggleActive = async (partner: PartnerRow) => {
    const { error } = await supabase
      .from("partners")
      .update({ is_active: !partner.is_active })
      .eq("id", partner.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Partner updated" });
    fetchPartners();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Partner Directory</h1>
          <p className="text-muted-foreground mt-2">
            Maintain the official list of research partners shown in public stats.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base">Partners</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading partners…</p>
              ) : partners.length === 0 ? (
                <p className="text-sm text-muted-foreground">No partners yet. Add your first partner.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-medium">{partner.name}</TableCell>
                        <TableCell>{partner.country}</TableCell>
                        <TableCell>
                          {partner.website ? (
                            <a
                              href={partner.website}
                              className="text-primary hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {partner.website}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={partner.is_active}
                              onCheckedChange={() => toggleActive(partner)}
                              aria-label={`Set ${partner.name} active status`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {partner.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(partner.updated_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => startEdit(partner)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base">{editId ? "Edit partner" : "Add partner"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partner-name">Name</Label>
                <Input
                  id="partner-name"
                  value={editId ? editName : name}
                  onChange={(event) =>
                    editId ? setEditName(event.target.value) : setName(event.target.value)
                  }
                  placeholder="University of Example"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-country">Country</Label>
                <Input
                  id="partner-country"
                  value={editId ? editCountry : country}
                  onChange={(event) =>
                    editId ? setEditCountry(event.target.value) : setCountry(event.target.value)
                  }
                  placeholder="Kenya"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-website">Website</Label>
                <Input
                  id="partner-website"
                  value={editId ? editWebsite : website}
                  onChange={(event) =>
                    editId ? setEditWebsite(event.target.value) : setWebsite(event.target.value)
                  }
                  placeholder="https://example.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-logo">Logo URL</Label>
                <Input
                  id="partner-logo"
                  value={editId ? editLogoUrl : logoUrl}
                  onChange={(event) =>
                    editId ? setEditLogoUrl(event.target.value) : setLogoUrl(event.target.value)
                  }
                  placeholder="https://example.edu/logo.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-email">Contact email</Label>
                <Input
                  id="partner-email"
                  value={editId ? editContactEmail : contactEmail}
                  onChange={(event) =>
                    editId ? setEditContactEmail(event.target.value) : setContactEmail(event.target.value)
                  }
                  placeholder="research@example.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-phone">Contact phone</Label>
                <Input
                  id="partner-phone"
                  value={editId ? editContactPhone : contactPhone}
                  onChange={(event) =>
                    editId ? setEditContactPhone(event.target.value) : setContactPhone(event.target.value)
                  }
                  placeholder="+254 700 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-description">Description</Label>
                <Textarea
                  id="partner-description"
                  value={editId ? editDescription : description}
                  onChange={(event) =>
                    editId ? setEditDescription(event.target.value) : setDescription(event.target.value)
                  }
                  placeholder="Short description or focus area"
                />
              </div>

              <div className="flex items-center gap-2">
                {editId ? (
                  <>
                    <Button onClick={saveEdit} disabled={saving}>
                      Save changes
                    </Button>
                    <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={createPartner} disabled={saving}>
                    Add partner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
