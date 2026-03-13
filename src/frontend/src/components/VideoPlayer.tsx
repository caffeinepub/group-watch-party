import { Badge } from "@/components/ui/badge";
import { type RefObject, useEffect, useRef } from "react";
import type { MediaItem } from "../backend";

type VideoKind =
  | "youtube"
  | "vimeo"
  | "dailymotion"
  | "twitch"
  | "direct"
  | "iframe";

interface ParsedUrl {
  kind: VideoKind;
  embedUrl: string;
  label: string;
}

export function parseVideoUrl(url: string): ParsedUrl {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|youtube\.com\/v\/)+([\w-]{11})/,
  );
  if (ytMatch) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
      label: "YouTube",
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/);
  if (vimeoMatch) {
    return {
      kind: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      label: "Vimeo",
    };
  }

  // Dailymotion
  const dmMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  if (dmMatch) {
    return {
      kind: "dailymotion",
      embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}`,
      label: "Dailymotion",
    };
  }

  // Twitch channel
  const twitchMatch = url.match(/twitch\.tv\/([\w]+)(?:\/?$|\?|#)/);
  if (twitchMatch) {
    const parent =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    return {
      kind: "twitch",
      embedUrl: `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${parent}`,
      label: "Twitch",
    };
  }

  // Direct video file
  const lower = url.toLowerCase().split("?")[0];
  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".ogv") ||
    lower.endsWith(".m3u8") ||
    lower.endsWith(".mov")
  ) {
    return { kind: "direct", embedUrl: url, label: "Video" };
  }

  // Generic iframe fallback
  return { kind: "iframe", embedUrl: url, label: "Web" };
}

const KIND_COLORS: Record<VideoKind, string> = {
  youtube: "bg-red-600 text-white",
  vimeo: "bg-blue-500 text-white",
  dailymotion: "bg-orange-500 text-white",
  twitch: "bg-purple-600 text-white",
  direct: "bg-emerald-600 text-white",
  iframe: "bg-muted text-muted-foreground",
};

interface Props {
  mediaItem: MediaItem;
  isPlaying: boolean;
  position: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  videoRef?: RefObject<HTMLVideoElement | null>;
  isAdmin?: boolean;
}

export default function VideoPlayer({
  mediaItem,
  isPlaying,
  position,
  onTimeUpdate,
  videoRef,
  isAdmin,
}: Props) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? internalRef;

  if (mediaItem.mediaType.__kind__ === "uploadedFile") {
    const src = mediaItem.mediaType.uploadedFile.getDirectURL();
    return (
      <div className="relative w-full h-full">
        <Badge className="absolute top-2 left-2 z-10 text-xs bg-emerald-600 text-white border-0">
          Uploaded
        </Badge>
        <VideoElement
          src={src}
          isPlaying={isPlaying}
          position={position}
          onTimeUpdate={onTimeUpdate}
          videoRef={ref as RefObject<HTMLVideoElement>}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  const url = mediaItem.mediaType.externalUrl;
  const parsed = parseVideoUrl(url);

  if (parsed.kind === "direct") {
    return (
      <div className="relative w-full h-full">
        <Badge
          className={`absolute top-2 left-2 z-10 text-xs border-0 ${KIND_COLORS.direct}`}
        >
          {parsed.label}
        </Badge>
        <VideoElement
          src={parsed.embedUrl}
          isPlaying={isPlaying}
          position={position}
          onTimeUpdate={onTimeUpdate}
          videoRef={ref as RefObject<HTMLVideoElement>}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  // Iframe-based embed (YouTube, Vimeo, Dailymotion, Twitch, generic)
  return (
    <div className="relative w-full h-full">
      <Badge
        className={`absolute top-2 left-2 z-10 text-xs border-0 ${KIND_COLORS[parsed.kind]}`}
      >
        {parsed.label}
      </Badge>
      <iframe
        src={parsed.embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title={mediaItem.title}
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  );
}

interface VideoElementProps {
  src: string;
  isPlaying: boolean;
  position: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  videoRef: RefObject<HTMLVideoElement>;
  isAdmin?: boolean;
}

function VideoElement({
  src,
  isPlaying,
  position,
  onTimeUpdate,
  videoRef,
  isAdmin,
}: VideoElementProps) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: videoRef is stable
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isAdmin && Math.abs(video.currentTime - position) > 3) {
      video.currentTime = position;
    }
  }, [position, isAdmin]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: videoRef is stable
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full h-full object-contain bg-black"
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        onTimeUpdate?.(v.currentTime, v.duration || 0);
      }}
      controls={isAdmin}
      playsInline
    >
      <track kind="captions" />
    </video>
  );
}
