import { type RefObject, useEffect, useRef } from "react";
import type { MediaItem } from "../backend";

function getYouTubeEmbedUrl(url: string): string | null {
  const pattern =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)+([\w-]{11})/;
  const match = url.match(pattern);
  if (match)
    return `https://www.youtube.com/embed/${match[1]}?autoplay=0&enablejsapi=1`;
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

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

  if (mediaItem.mediaType.__kind__ === "externalUrl") {
    const url = mediaItem.mediaType.externalUrl;
    const embedUrl = isYouTubeUrl(url) ? getYouTubeEmbedUrl(url) : null;

    if (embedUrl) {
      return (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={mediaItem.title}
        />
      );
    }

    return (
      <VideoElement
        src={url}
        isPlaying={isPlaying}
        position={position}
        onTimeUpdate={onTimeUpdate}
        videoRef={ref as RefObject<HTMLVideoElement>}
        isAdmin={isAdmin}
      />
    );
  }

  const src = mediaItem.mediaType.uploadedFile.getDirectURL();
  return (
    <VideoElement
      src={src}
      isPlaying={isPlaying}
      position={position}
      onTimeUpdate={onTimeUpdate}
      videoRef={ref as RefObject<HTMLVideoElement>}
      isAdmin={isAdmin}
    />
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: videoRef is a stable ref, .current excluded intentionally
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isAdmin && Math.abs(video.currentTime - position) > 3) {
      video.currentTime = position;
    }
  }, [position, isAdmin]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: videoRef is a stable ref, .current excluded intentionally
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    onTimeUpdate?.(v.currentTime, v.duration || 0);
  };

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full h-full object-contain bg-black"
      onTimeUpdate={handleTimeUpdate}
      controls={false}
      playsInline
    >
      <track kind="captions" />
    </video>
  );
}
