import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { Film, Library, LogOut, MessageCircle, Users } from "lucide-react";
import { useState } from "react";
import type { UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import AdminChatTab from "./AdminChatTab";
import AdminWatchParty from "./AdminWatchParty";
import MediaLibrary from "./MediaLibrary";
import UsersTab from "./UsersTab";

interface Props {
  userProfile: UserProfile;
}

export default function AdminView({ userProfile }: Props) {
  const [tab, setTab] = useState("watch");
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Film className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-display font-bold text-base text-foreground">
              Group Watch Party
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {userProfile.displayName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground h-8 px-3"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-4">
        <Tabs value={tab} onValueChange={setTab} className="h-full">
          <TabsList className="mb-4 bg-card border border-border h-10">
            <TabsTrigger
              value="watch"
              data-ocid="nav.watch_party_tab"
              className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Film className="w-3.5 h-3.5 mr-1.5" />
              Watch Party
            </TabsTrigger>
            <TabsTrigger
              value="library"
              data-ocid="nav.media_library_tab"
              className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Library className="w-3.5 h-3.5 mr-1.5" />
              Media Library
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-ocid="nav.users_tab"
              className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              data-ocid="nav.chat_tab"
              className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watch" className="mt-0">
            <AdminWatchParty userProfile={userProfile} />
          </TabsContent>
          <TabsContent value="library" className="mt-0">
            <MediaLibrary />
          </TabsContent>
          <TabsContent value="users" className="mt-0">
            <UsersTab />
          </TabsContent>
          <TabsContent value="chat" className="mt-0">
            <AdminChatTab userProfile={userProfile} />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="border-t border-border/30 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
