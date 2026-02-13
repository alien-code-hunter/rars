import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { ApplicantType } from "@/lib/types";
import { User, Lock, Save, Loader2, Building, Phone, Mail } from "lucide-react";

const applicantTypeOptions: { value: ApplicantType; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "ACADEMIC", label: "Academic / Researcher" },
  { value: "NGO", label: "NGO" },
  { value: "CONSULTANT", label: "Consultant" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "OTHER", label: "Other" },
];

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    institution: "",
    department: "",
    applicant_type: "OTHER" as ApplicantType,
  });
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const isNameMissing = form.full_name.trim().length === 0;

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        institution: profile.institution || "",
        department: profile.department || "",
        applicant_type: (profile.applicant_type || "OTHER") as ApplicantType,
      });
    }
  }, [profile]);

  const updateProfile = async () => {
    if (!user) return;
    if (isNameMissing) {
      toast({
        title: "Full name required",
        description: "Please enter your full name before saving your profile.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        institution: form.institution,
        department: form.department,
        applicant_type: form.applicant_type,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    await refreshProfile();
    toast({ title: "Profile updated successfully" });
  };

  const updatePassword = async () => {
    if (!password || password !== confirmPassword) {
      toast({ title: "Password mismatch", description: "Please make sure the passwords match.", variant: "destructive" });
      return;
    }

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setUpdatingPassword(false);

    if (error) {
      toast({ title: "Password update failed", description: error.message, variant: "destructive" });
      return;
    }

    setPassword("");
    setConfirmPassword("");
    toast({ title: "Password updated successfully" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="hero-gradient hero-surface text-primary-foreground">
        <div className="container hero-content py-10">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
              <User className="h-8 w-8 text-primary-foreground/80" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Profile & Settings</h1>
              <p className="mt-1 text-primary-foreground/75">Update your personal and academic details</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Card */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription>Your profile details used in applications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {isNameMissing && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Please add your full name. This appears on applications and reviewer documents.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Dr. Jane Doe"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="h-11 pl-10 bg-muted/50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+264 81 123 4567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-11 pl-10"
                  />
                </div>
              </div>
              
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="institution"
                    placeholder="University of Namibia"
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="School of Public Health"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Applicant Type</Label>
                <Select
                  value={form.applicant_type}
                  onValueChange={(value: ApplicantType) => setForm({ ...form, applicant_type: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {applicantTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={updateProfile} disabled={saving || isNameMissing} className="w-full h-11">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Password Card */}
          <Card className="border border-border/50 shadow-sm h-fit">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                  <Lock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Change Password</CardTitle>
                  <CardDescription>Update your account security credentials</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button onClick={updatePassword} disabled={updatingPassword} variant="outline" className="w-full h-11">
                {updatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                {updatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
