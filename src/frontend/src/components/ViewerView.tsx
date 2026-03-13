import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Film, LogOut, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllMediaItems,
  useGetMutedChatUsers,
  useGetMutedReactionUsers,
  useGetPlaybackState,
} from "../hooks/useQueries";
import ChatPanel from "./ChatPanel";
import ParticipantsPanel from "./ParticipantsPanel";
import ReactionsBar from "./ReactionsBar";
import VideoPlayer from "./VideoPlayer";

interface Props {
  userProfile: UserProfile;
}

export default function ViewerView({ userProfile }: Props) {
  const { data: mediaItems = [], isLoading: mediaLoading } =
    useGetAllMediaItems();
  const { data: playbackState } = useGetPlaybackState();
  const { data: mutedChatUsers = [] } = useGetMutedChatUsers();
  const { data: mutedReactionUsers = [] } = useGetMutedReactionUsers();
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();

  const [isPlaying, setIsPlaying] = useState(false);
  const [syncedPosition, setSyncedPosition] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentMedia =
    playbackState && mediaItems.length > 0
      ? (mediaItems.find((m) => m.id === playbackState.currentMediaId) ?? null)
      : null;

  const myPrincipal = userProfile.principal.toString();
  const isChatMuted = mutedChatUsers.some((p) => p.toString() === myPrincipal);
  const isReactionMuted = mutedReactionUsers.some(
    (p) => p.toString() === myPrincipal,
  );

  useEffect(() => {
    if (!playbackState) return;
    setIsPlaying(playbackState.isPlaying);
    setSyncedPosition(Number(playbackState.position));

    if (videoRef.current) {
      const drift = Math.abs(
        videoRef.current.currentTime - Number(playbackState.position),
      );
      if (drift > 3)
        videoRef.current.currentTime = Number(playbackState.position);
      if (playbackState.isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else if (!playbackState.isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [playbackState]);

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Film className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-display font-bold text-base text-foreground">
              Group Watch Party
            </span>
            {isPlaying && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs font-semibold">
                <Radio className="w-2.5 h-2.5" />
                LIVE
              </span>
            )}
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

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-3">
        {mediaLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-3 h-[calc(100vh-120px)]">
            <Skeleton className="rounded-xl" data-ocid="viewer.loading_state" />
            <Skeleton className="rounded-xl" />
            <Skeleton className="rounded-xl" />
          </div>
        ) : !currentMedia && mediaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Radio className="w-6 h-6 text-primary animate-pulse-amber" />
            </div>
            <p className="font-display font-semibold text-foreground mb-1">
              Waiting for the watch party to begin
            </p>
            <p className="text-sm text-muted-foreground">
              The admin will start streaming soon!
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 lg:grid-cols-[260px_1fr_220px] gap-3"
            style={{ minHeight: "calc(100vh - 120px)" }}
          >
            {/* Left: Participants + Chat */}
            <div className="flex flex-col gap-3 min-h-0">
              <div
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
                style={{ height: "200px" }}
              >
                <ParticipantsPanel userProfile={userProfile} isAdmin={false} />
              </div>
              <div
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col flex-1"
                style={{ minHeight: "300px" }}
              >
                <ChatPanel
                  userProfile={userProfile}
                  isAdmin={false}
                  isMuted={isChatMuted}
                />
              </div>
            </div>

            {/* Center: Video + Reactions */}
            <div className="flex flex-col min-h-0">
              <div
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col cinema-glow"
                data-ocid="video.player.panel"
              >
                {currentMedia ? (
                  <>
                    <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
                      <p className="font-display font-semibold text-sm text-foreground truncate">
                        {currentMedia.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPlaying
                              ? "bg-primary animate-pulse-amber"
                              : "bg-muted-foreground"
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {isPlaying ? "Synced" : "Paused"}
                        </span>
                      </div>
                    </div>
                    <div className="aspect-video bg-black relative">
                      <VideoPlayer
                        mediaItem={currentMedia}
                        isPlaying={isPlaying}
                        position={syncedPosition}
                        videoRef={videoRef}
                        isAdmin={false}
                      />
                    </div>
                    <div className="relative">
                      <ReactionsBar
                        userProfile={userProfile}
                        isMuted={isReactionMuted}
                      />
                    </div>
                  </>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-black">
                    <div className="text-center">
                      <Radio className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2 animate-pulse-amber" />
                      <p className="text-sm text-muted-foreground">
                        Waiting for admin to select media…
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Media queue info */}
            <div
              className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
              style={{ minHeight: "300px" }}
            >
              <div className="px-4 py-3 border-b border-border/40">
                <p className="font-display font-semibold text-sm text-foreground">
                  Up Next
                </p>
              </div>
              <ScrollArea className="flex-1 p-3">
                {mediaItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No media in queue
                  </p>
                ) : (
                  <div className="space-y-2">
                    {mediaItems.map((item) => (
                      <div
                        key={item.id.toString()}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                          item.id === currentMedia?.id
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/40 hover:bg-muted/30"
                        }`}
                      >
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Film className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-foreground truncate flex-1">
                          {item.title}
                        </p>
                        {item.id === currentMedia?.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-amber flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </main>

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
