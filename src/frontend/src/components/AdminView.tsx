import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  Film,
  LogOut,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddMediaItem,
  useGetAllMediaItems,
  useGetMutedReactionUsers,
  useGetPlaybackState,
  useUpdatePlaybackState,
} from "../hooks/useQueries";
import AdminPanel from "./AdminPanel";
import ChatPanel from "./ChatPanel";
import ParticipantsPanel from "./ParticipantsPanel";
import ReactionsBar from "./ReactionsBar";
import VideoPlayer from "./VideoPlayer";

interface Props {
  userProfile: UserProfile;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminView({ userProfile }: Props) {
  const { data: mediaItems = [], isLoading: mediaLoading } =
    useGetAllMediaItems();
  const { data: playbackState } = useGetPlaybackState();
  const { data: mutedReactionUsers = [] } = useGetMutedReactionUsers();
  const { mutate: updatePlayback } = useUpdatePlaybackState();
  const { mutateAsync: addMedia, isPending: addingMedia } = useAddMediaItem();
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();

  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentMedia = mediaItems[currentMediaIdx] ?? null;

  const prevMediaId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!playbackState || mediaItems.length === 0) return;
    const mediaIdStr = playbackState.currentMediaId?.toString();
    if (prevMediaId.current === mediaIdStr) return;
    prevMediaId.current = mediaIdStr;
    const idx = mediaItems.findIndex(
      (m) => m.id === playbackState.currentMediaId,
    );
    if (idx !== -1) setCurrentMediaIdx(idx);
    setIsPlaying(playbackState.isPlaying);
    setPosition(Number(playbackState.position));
  });

  const pushPlaybackState = useCallback(
    (mediaId: bigint, pos: number, playing: boolean) => {
      updatePlayback({
        currentMediaId: mediaId,
        position: BigInt(Math.floor(pos)),
        isPlaying: playing,
      });
    },
    [updatePlayback],
  );

  const handlePlayPause = () => {
    if (!currentMedia) return;
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    if (videoRef.current) {
      if (newPlaying) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
    pushPlaybackState(currentMedia.id, position, newPlaying);
  };

  const handlePrev = () => {
    if (currentMediaIdx > 0) {
      const newIdx = currentMediaIdx - 1;
      setCurrentMediaIdx(newIdx);
      setPosition(0);
      const media = mediaItems[newIdx];
      if (media) pushPlaybackState(media.id, 0, isPlaying);
    }
  };

  const handleNext = () => {
    if (currentMediaIdx < mediaItems.length - 1) {
      const newIdx = currentMediaIdx + 1;
      setCurrentMediaIdx(newIdx);
      setPosition(0);
      const media = mediaItems[newIdx];
      if (media) pushPlaybackState(media.id, 0, isPlaying);
    }
  };

  const handleAddUrl = async () => {
    const url = urlInput.trim();
    const title = titleInput.trim() || url;
    if (!url) return;
    try {
      const id = await addMedia({
        title,
        mediaType: { __kind__: "externalUrl", externalUrl: url },
        metadata: null,
      });
      // Set as active
      updatePlayback({ currentMediaId: id, position: 0n, isPlaying: false });
      setUrlInput("");
      setTitleInput("");
      toast.success("Video added and set as active!");
    } catch {
      toast.error("Failed to add video");
    }
  };

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  const isReactionMuted = mutedReactionUsers.some(
    (p) => p.toString() === userProfile.principal.toString(),
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
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

          {/* Quick URL input */}
          <div className="flex-1 max-w-lg hidden md:flex items-center gap-2">
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Title (optional)"
              className="h-7 text-xs bg-muted border-input w-32"
            />
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
              placeholder="Paste any video URL…"
              data-ocid="video.url.input"
              className="h-7 text-xs bg-muted border-input flex-1"
            />
            <Button
              onClick={handleAddUrl}
              disabled={addingMedia || !urlInput.trim()}
              size="sm"
              data-ocid="video.url.submit_button"
              className="h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
            >
              {addingMedia ? "…" : "▶ Play"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <AdminPanel
              userProfile={userProfile}
              currentMediaId={currentMedia?.id}
              currentPosition={position}
              isPlaying={isPlaying}
            />
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
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_220px] gap-3 h-[calc(100vh-120px)]">
            <Skeleton className="rounded-xl" data-ocid="player.loading_state" />
            <Skeleton className="rounded-xl" />
            <Skeleton className="rounded-xl" />
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Radio className="w-6 h-6 text-primary" />
            </div>
            <p className="font-display font-semibold text-foreground mb-1">
              No media yet
            </p>
            <p className="text-sm text-muted-foreground">
              Paste a video URL in the header bar to start streaming!
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
                <ParticipantsPanel userProfile={userProfile} isAdmin />
              </div>
              <div
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col flex-1"
                style={{ minHeight: "300px" }}
              >
                <ChatPanel userProfile={userProfile} isAdmin />
              </div>
            </div>

            {/* Center: Video + Controls + Reactions */}
            <div className="flex flex-col gap-2 min-h-0">
              <div
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col cinema-glow"
                data-ocid="video.player.panel"
              >
                {/* Media selector pills */}
                <div className="px-3 pt-2 pb-2 border-b border-border/30">
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {mediaItems.map((item, i) => (
                      <button
                        type="button"
                        key={item.id.toString()}
                        onClick={() => {
                          setCurrentMediaIdx(i);
                          setPosition(0);
                          pushPlaybackState(item.id, 0, isPlaying);
                        }}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          i === currentMediaIdx
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video */}
                <div className="aspect-video bg-black">
                  {currentMedia ? (
                    <VideoPlayer
                      mediaItem={currentMedia}
                      isPlaying={isPlaying}
                      position={position}
                      onTimeUpdate={(t, d) => {
                        setPosition(t);
                        setDuration(d);
                      }}
                      videoRef={videoRef}
                      isAdmin
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No media</p>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="px-3 py-2 border-t border-border/30">
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrev}
                      disabled={currentMediaIdx === 0}
                      className="w-8 h-8 text-muted-foreground hover:text-foreground"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={handlePlayPause}
                      disabled={!currentMedia}
                      className="w-9 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNext}
                      disabled={currentMediaIdx >= mediaItems.length - 1}
                      className="w-8 h-8 text-muted-foreground hover:text-foreground"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs tabular-nums text-muted-foreground ml-2">
                      {formatTime(position)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>

                {/* Reactions */}
                <div className="relative border-t border-border/20">
                  <ReactionsBar
                    userProfile={userProfile}
                    isMuted={isReactionMuted}
                  />
                </div>
              </div>
            </div>

            {/* Right: Up Next */}
            <div
              className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
              style={{ minHeight: "300px" }}
            >
              <div className="px-4 py-3 border-b border-border/40">
                <p className="font-display font-semibold text-sm text-foreground">
                  Media Queue
                </p>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {mediaItems.map((item, i) => (
                    <button
                      type="button"
                      key={item.id.toString()}
                      onClick={() => {
                        setCurrentMediaIdx(i);
                        setPosition(0);
                        pushPlaybackState(item.id, 0, isPlaying);
                      }}
                      className={`w-full text-left flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                        i === currentMediaIdx
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/40 hover:bg-muted/30 hover:border-primary/20"
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <Film className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-foreground truncate flex-1">
                        {item.title}
                      </p>
                      {i === currentMediaIdx && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-amber flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
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
