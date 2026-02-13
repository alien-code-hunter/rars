import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Profile, UserRole } from "@/lib/types";

interface UserRow extends Profile {
  roles: UserRole[];
}

const roleOptions: UserRole[] = [
  "APPLICANT",
  "ADMIN_OFFICER",
  "REVIEWER",
  "EXECUTIVE_DIRECTOR",
  "SYSTEM_ADMIN",
];

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);

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

  useEffect(() => {
    fetchUsers();
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, roles, and access.
          </p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
