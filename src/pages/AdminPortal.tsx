import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { Profile, UserRole } from "@/lib/types";

interface UserRow extends Profile {
  roles: UserRole[];
}

interface AuditLog {
  id: string;
  actor_id?: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  created_at: string;
}

const roleOptions: UserRole[] = [
  "APPLICANT",
  "ADMIN_OFFICER",
  "REVIEWER",
  "EXECUTIVE_DIRECTOR",
  "SYSTEM_ADMIN",
];

export default function AdminPortal() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("REVIEWER");
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("ADMIN_OFFICER");
  const [createPassword, setCreatePassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);

  const reviewerCount = useMemo(
    () => users.filter((user) => user.roles.includes("REVIEWER")).length,
    [users]
  );

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    const roleMap = new Map<string, UserRole[]>();
    (roles || []).forEach((row) => {
      const existing = roleMap.get(row.user_id) || [];
      roleMap.set(row.user_id, [...existing, row.role as UserRole]);
    });

    const mapped = (profiles as Profile[] | null)?.map((profile) => ({
      ...profile,
      roles: roleMap.get(profile.id) || [],
    }));

    setUsers(mapped || []);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    setLogs((data as AuditLog[]) || []);
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const updateRole = async (userId: string, role: UserRole) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role,
    });

    if (error) {
      toast({
        title: "Role update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Role updated" });
    fetchUsers();
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !isActive })
      .eq("id", userId);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "User updated" });
    fetchUsers();
  };

  const applyRole = async () => {
    if (!selectedUser) {
      toast({
        title: "Select a user",
        description: "Choose a user to assign a role.",
        variant: "destructive",
      });
      return;
    }

    await updateRole(selectedUser, selectedRole);
  };

  const createStaffAccount = async () => {
    if (!createEmail || !createName || !createRole || !createPassword) {
      toast({
        title: "Missing details",
        description: "Provide name, email, role, and temporary password.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: {
        action: "create",
        email: createEmail,
        full_name: createName,
        role: createRole,
        password: createPassword,
      },
    });

    setCreating(false);
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Account created",
      description: "Share the temporary password with the staff member.",
    });
    setCreateEmail("");
    setCreateName("");
    setCreatePassword("");
    fetchUsers();
  };

  const resetStaffPassword = async () => {
    if (!resetEmail || !resetPassword) {
      toast({
        title: "Missing details",
        description: "Provide the account email and new temporary password.",
        variant: "destructive",
      });
      return;
    }

    setResetting(true);
    const { error } = await supabase.functions.invoke("admin-users", {
      body: {
        action: "reset",
        email: resetEmail,
        password: resetPassword,
      },
    });
    setResetting(false);

    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password reset", description: "Share the new temporary password." });
    setResetEmail("");
    setResetPassword("");
  };

  const downloadFile = (content: string, filename: string, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    downloadFile(JSON.stringify(logs, null, 2), "audit-logs.json", "application/json");
  };

  const exportCsv = () => {
    const header = ["id", "actor_id", "entity_type", "entity_id", "action", "created_at"].join(","
    );
    const rows = logs.map((log) =>
      [
        log.id,
        log.actor_id ?? "",
        log.entity_type,
        log.entity_id,
        log.action,
        log.created_at,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    downloadFile([header, ...rows].join("\n"), "audit-logs.csv", "text/csv");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground mt-2">
            Manage staff accounts, reviewers, and system logs.
          </p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/admin/partners">Manage partners</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base">Staff & Reviewer Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-border/60 p-4">
                  <p className="text-sm font-medium">Create staff account</p>
                  <p className="text-xs text-muted-foreground">
                    Create accounts for admin officers, reviewers, and directors.
                  </p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label htmlFor="create-name">Full name</Label>
                      <Input
                        id="create-name"
                        value={createName}
                        onChange={(event) => setCreateName(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-email">Email</Label>
                      <Input
                        id="create-email"
                        type="email"
                        value={createEmail}
                        onChange={(event) => setCreateEmail(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select value={createRole} onValueChange={(value: UserRole) => setCreateRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="create-password">Temporary password</Label>
                      <Input
                        id="create-password"
                        type="text"
                        value={createPassword}
                        onChange={(event) => setCreatePassword(event.target.value)}
                      />
                    </div>
                    <Button onClick={createStaffAccount} disabled={creating}>
                      {creating ? "Creating..." : "Create account"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 p-4">
                  <p className="text-sm font-medium">Reset staff password</p>
                  <p className="text-xs text-muted-foreground">
                    Set a new temporary password for an account.
                  </p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(event) => setResetEmail(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reset-password">New temporary password</Label>
                      <Input
                        id="reset-password"
                        type="text"
                        value={resetPassword}
                        onChange={(event) => setResetPassword(event.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={resetStaffPassword} disabled={resetting}>
                      {resetting ? "Resetting..." : "Reset password"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-4">
                <p className="text-sm font-medium">Quick role assignment</p>
                <p className="text-xs text-muted-foreground">
                  Add reviewers by assigning the REVIEWER role.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={applyRole}>Apply</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link to="/assign">Assign reviewers</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/reviews">Review assignments</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/admin/analytics">Repository analytics</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/admin/reports">Exports & reports</Link>
                </Button>
                <div className="text-xs text-muted-foreground self-center">
                  Active reviewers: {reviewerCount}
                </div>
              </div>

              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={user.roles[0] || "APPLICANT"}
                        onValueChange={(value: UserRole) => updateRole(user.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(user.id, user.is_active)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated h-fit">
            <CardHeader className="flex flex-col gap-3">
              <CardTitle className="text-base">Audit Logs</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportJson}>
                  Export JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No audit events recorded.</p>
              ) : (
                logs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-1 rounded-lg border border-border/60 p-3 text-sm"
                  >
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground">
                      {log.entity_type} · {log.entity_id}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                ))
              )}
              <Button variant="outline" asChild className="w-full">
                <Link to="/admin/audit">View full logs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
