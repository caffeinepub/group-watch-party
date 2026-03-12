import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Pause, Play, Radio, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UserProfile } from "../backend";
import {
  useGetAllMediaItems,
  useGetPlaybackState,
  useUpdatePlaybackState,
} from "../hooks/useQueries";
import ChatPanel from "./ChatPanel";
import VideoPlayer from "./VideoPlayer";

interface Props {
  userProfile: UserProfile;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminWatchParty({ userProfile }: Props) {
  const { data: mediaItems = [], isLoading: mediaLoading } =
    useGetAllMediaItems();
  const { data: playbackState } = useGetPlaybackState();
  const { mutate: updatePlayback } = useUpdatePlaybackState();

  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentMedia = mediaItems[currentMediaIdx] ?? null;

  // Sync initial playback state from server (only on media ID change)
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

  const handleSeekCommit = (val: number[]) => {
    const pos = val[0];
    setPosition(pos);
    setIsSeeking(false);
    if (videoRef.current) videoRef.current.currentTime = pos;
    if (currentMedia) pushPlaybackState(currentMedia.id, pos, isPlaying);
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

  const handleTimeUpdate = (currentTime: number, dur: number) => {
    if (!isSeeking) setPosition(currentTime);
    setDuration(dur);
  };

  if (mediaLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
        <Skeleton
          className="lg:col-span-2 rounded-xl"
          data-ocid="player.loading_state"
        />
        <Skeleton className="rounded-xl" />
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Radio className="w-6 h-6 text-primary" />
        </div>
        <p className="font-display font-semibold text-foreground mb-1">
          No media yet
        </p>
        <p className="text-sm text-muted-foreground">
          Add items in the Media Library tab to start.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      style={{ minHeight: "calc(100vh - 180px)" }}
    >
      {/* Player column */}
      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Media selector */}
          <div className="px-4 pt-3 pb-2 border-b border-border/40">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mediaItems.map((item, i) => (
                <button
                  type="button"
                  key={item.id.toString()}
                  onClick={() => {
                    setCurrentMediaIdx(i);
                    setPosition(0);
                    pushPlaybackState(item.id, 0, isPlaying);
                  }}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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
                onTimeUpdate={handleTimeUpdate}
                videoRef={videoRef}
                isAdmin
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  No media selected
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                {formatTime(position)}
              </span>
              <Slider
                value={[position]}
                min={0}
                max={duration || 100}
                step={1}
                onValueChange={(val) => {
                  setIsSeeking(true);
                  setPosition(val[0]);
                }}
                onValueCommit={handleSeekCommit}
                data-ocid="player.seek_input"
                className="flex-1 [&_[role=slider]]:bg-primary"
              />
              <span className="text-xs tabular-nums text-muted-foreground w-10">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={currentMediaIdx === 0}
                data-ocid="player.prev_button"
                className="w-9 h-9 text-muted-foreground hover:text-foreground"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={handlePlayPause}
                data-ocid="player.play_toggle"
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
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
                data-ocid="player.next_button"
                className="w-9 h-9 text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat column */}
      <div
        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
        style={{ minHeight: "400px" }}
      >
        <ChatPanel userProfile={userProfile} isAdmin />
      </div>
    </div>
  );
}
