import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials, getRoleLabel } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabaseHelpers';
import type { Notification } from '@/lib/types';
import { User, LogOut, Settings, LayoutDashboard, ChevronDown, Bell, Bookmark } from 'lucide-react';

export function Header() {
  const { user, profile, roles, signOut } = useAuth();
  const roleLabel = getRoleLabel(roles);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!user || !supabaseConfigured) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      setNotifications((data as Notification[]) || []);
    };

    fetchNotifications();
  }, [user?.id, supabaseConfigured]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const markAllRead = async () => {
    if (!user || !supabaseConfigured || unreadCount === 0) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <img
                src="/correct - Coat of Arms.png"
                alt="Coat of Arms"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground leading-tight">RARS</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Ministry of Health</p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/">Home</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/repository">Repository</Link>
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/applications/new">New Application</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/dashboard">Dashboard</Link>
              </Button>

              {supabaseConfigured && (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-xl hover:bg-muted"
                    aria-label="Open notifications"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-popover">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 px-2 text-xs">
                      Mark all read
                    </Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <DropdownMenuItem key={item.id} asChild>
                        <Link
                          to={item.link || '/notifications'}
                          className="flex w-full flex-col gap-1 py-2"
                        >
                          <span className="text-sm font-medium">
                            {item.title}
                            {!item.is_read && <span className="ml-2 text-xs text-primary">New</span>}
                          </span>
                          {item.body && (
                            <span className="text-xs text-muted-foreground">{item.body}</span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="cursor-pointer text-sm">
                      View all
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 pl-2 pr-3 h-10 rounded-xl hover:bg-muted"
                    aria-label="Open user menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium leading-tight">{profile?.full_name || 'User'}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{roleLabel}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 bg-popover">
                  <DropdownMenuLabel className="pb-3">
                    <div className="flex flex-col space-y-1.5">
                      <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="w-fit text-[10px]">{roleLabel}</Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="cursor-pointer">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/watchlist" className="cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Tracked Research
                    </Link>
                  </DropdownMenuItem>
                  {roles.includes('SYSTEM_ADMIN') && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Settings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?mode=signup">Register</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
