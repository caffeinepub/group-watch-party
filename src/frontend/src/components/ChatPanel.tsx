import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Film,
  ImageIcon,
  Maximize2,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, MediaKind, type UserProfile } from "../backend";
import {
  useDeleteMessage,
  useGetAllMessages,
  useSendMediaMessage,
  useSendMessage,
} from "../hooks/useQueries";

interface Props {
  userProfile: UserProfile;
  isAdmin?: boolean;
  isMuted?: boolean;
}

type PendingMedia =
  | {
      kind: "image" | "video";
      file: File;
      previewUrl: string;
      caption: string;
      progress: number;
    }
  | {
      kind: "audio";
      blob: Blob;
      previewUrl: string;
      caption: string;
      progress: number;
    };

function formatRelTime(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface MessageAttachmentProps {
  attachment: NonNullable<
    ReturnType<typeof useGetAllMessages>["data"]
  >[number]["attachment"];
}

function MessageAttachment({ attachment }: MessageAttachmentProps) {
  const [expanded, setExpanded] = useState(false);
  if (!attachment) return null;

  const url = attachment.blob.getDirectURL();

  if (attachment.kind === MediaKind.image) {
    return (
      <div className="mt-1.5">
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            onKeyDown={(e) => e.key === "Enter" && setExpanded(true)}
            className="p-0 border-0 bg-transparent cursor-zoom-in"
          >
            <img
              src={url}
              alt={attachment.caption ?? "Image"}
              className="max-h-48 rounded-lg object-cover border border-border/40 hover:opacity-90 transition-opacity"
            />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
        {attachment.caption && (
          <p className="text-xs text-muted-foreground mt-1">
            {attachment.caption}
          </p>
        )}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out p-4"
            >
              <img
                src={url}
                alt={attachment.caption ?? "Image"}
                className="max-w-full max-h-full rounded-xl object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (attachment.kind === MediaKind.video) {
    return (
      <div className="mt-1.5">
        {/* biome-ignore lint/a11y/useMediaCaption: user-generated chat content */}
        <video
          src={url}
          controls
          className="max-h-48 rounded-lg border border-border/40 w-full"
        />
        {attachment.caption && (
          <p className="text-xs text-muted-foreground mt-1">
            {attachment.caption}
          </p>
        )}
      </div>
    );
  }

  if (attachment.kind === MediaKind.audio) {
    return (
      <div className="mt-1.5 bg-muted/50 rounded-lg px-3 py-2 border border-border/40">
        <div className="flex items-center gap-2">
          <Mic className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs text-muted-foreground">Voice message</span>
        </div>
        {/* biome-ignore lint/a11y/useMediaCaption: user-generated chat content */}
        <audio src={url} controls className="w-full h-8 mt-1" />
        {attachment.caption && (
          <p className="text-xs text-muted-foreground mt-1">
            {attachment.caption}
          </p>
        )}
      </div>
    );
  }

  return null;
}

export default function ChatPanel({ userProfile, isAdmin, isMuted }: Props) {
  const { data: messages = [] } = useGetAllMessages();
  const { mutateAsync: sendMessage, isPending: sending } = useSendMessage();
  const { mutateAsync: sendMediaMessage, isPending: sendingMedia } =
    useSendMediaMessage();
  const { mutateAsync: deleteMessage } = useDeleteMessage();

  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const msgCount = messages.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgCount]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (pendingMedia) URL.revokeObjectURL(pendingMedia.previewUrl);
    };
  }, [pendingMedia]);

  const handleSend = async () => {
    if (!text.trim() || isMuted) return;
    try {
      await sendMessage({
        displayName: userProfile.displayName,
        text: text.trim(),
      });
      setText("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteMessage(id);
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "image" | "video",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingMedia({ kind, file, previewUrl, caption: "", progress: 0 });
    e.target.value = "";
  };

  const handleSendMedia = async () => {
    if (!pendingMedia || isMuted) return;
    try {
      let bytes: Uint8Array<ArrayBuffer>;
      let blobKind: MediaKind;

      if (pendingMedia.kind === "audio") {
        bytes = new Uint8Array(
          await pendingMedia.blob.arrayBuffer(),
        ) as Uint8Array<ArrayBuffer>;
        blobKind = MediaKind.audio;
      } else {
        bytes = new Uint8Array(
          await pendingMedia.file.arrayBuffer(),
        ) as Uint8Array<ArrayBuffer>;
        blobKind =
          pendingMedia.kind === "image" ? MediaKind.image : MediaKind.video;
      }

      const externalBlob = ExternalBlob.fromBytes(bytes).withUploadProgress(
        (pct) => {
          setPendingMedia((prev) => (prev ? { ...prev, progress: pct } : null));
        },
      );

      await sendMediaMessage({
        displayName: userProfile.displayName,
        caption: pendingMedia.caption.trim() || null,
        blob: externalBlob,
        kind: blobKind,
      });

      URL.revokeObjectURL(pendingMedia.previewUrl);
      setPendingMedia(null);
      toast.success("Media sent!");
    } catch {
      toast.error("Failed to send media");
      setPendingMedia((prev) => (prev ? { ...prev, progress: 0 } : null));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const previewUrl = URL.createObjectURL(blob);
        setPendingMedia({
          kind: "audio",
          blob,
          previewUrl,
          caption: "",
          progress: 0,
        });
        for (const t of stream.getTracks()) t.stop();
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const cancelPending = () => {
    if (pendingMedia) URL.revokeObjectURL(pendingMedia.previewUrl);
    setPendingMedia(null);
  };

  const isSendingAny = sending || sendingMedia;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="font-display font-semibold text-sm text-foreground">
          Live Chat
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {messages.length}
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        {messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-32 text-center"
            data-ocid="chat.empty_state"
          >
            <MessageCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id.toString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                data-ocid={`chat.item.${i + 1}`}
                className="group flex items-start gap-2 py-2 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-primary truncate">
                      {msg.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatRelTime(msg.timestamp)}
                    </span>
                  </div>
                  {msg.text && (
                    <p className="text-sm text-foreground leading-snug break-words">
                      {msg.text}
                    </p>
                  )}
                  {msg.attachment && (
                    <MessageAttachment attachment={msg.attachment} />
                  )}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(msg.id)}
                    data-ocid={`chat.delete_button.${i + 1}`}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                    title="Delete message"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input area */}
      <div className="px-3 py-3 border-t border-border/40 space-y-2">
        {isMuted ? (
          <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
            <MicOff className="w-4 h-4" />
            <span className="text-xs">You are muted from chat</span>
          </div>
        ) : (
          <>
            {/* Pending media preview */}
            <AnimatePresence>
              {pendingMedia && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-muted/50 rounded-lg p-2 border border-border/40 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    {/* Preview thumbnail */}
                    <div className="flex-shrink-0">
                      {pendingMedia.kind === "image" && (
                        <img
                          src={pendingMedia.previewUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded object-cover border border-border/40"
                        />
                      )}
                      {pendingMedia.kind === "video" && (
                        <div className="w-16 h-16 rounded bg-muted flex flex-col items-center justify-center border border-border/40 gap-1">
                          <Film className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground text-center px-1 truncate w-full text-center">
                            {pendingMedia.file.name
                              .split(".")
                              .pop()
                              ?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {pendingMedia.kind === "audio" && (
                        <div className="w-16 h-16 rounded bg-muted flex flex-col items-center justify-center border border-border/40 gap-1">
                          <Mic className="w-5 h-5 text-primary" />
                          <span className="text-[10px] text-muted-foreground">
                            Voice
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info + caption */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground truncate">
                          {pendingMedia.kind === "audio"
                            ? "Voice message"
                            : pendingMedia.kind === "video"
                              ? `${pendingMedia.file.name} · ${formatBytes(pendingMedia.file.size)}`
                              : pendingMedia.file.name}
                        </span>
                        <button
                          type="button"
                          onClick={cancelPending}
                          className="text-muted-foreground hover:text-foreground transition-colors ml-1 flex-shrink-0"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {pendingMedia.kind === "audio" && (
                        // biome-ignore lint/a11y/useMediaCaption: user-generated content
                        <audio
                          src={pendingMedia.previewUrl}
                          controls
                          className="w-full h-7"
                        />
                      )}

                      <Input
                        placeholder="Add a caption… (optional)"
                        value={pendingMedia.caption}
                        onChange={(e) =>
                          setPendingMedia((prev) =>
                            prev ? { ...prev, caption: e.target.value } : null,
                          )
                        }
                        data-ocid="chat.input"
                        className="h-7 text-xs bg-background border-input"
                      />

                      {pendingMedia.progress > 0 &&
                        pendingMedia.progress < 100 && (
                          <div>
                            <Progress
                              value={pendingMedia.progress}
                              className="h-1"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              Uploading {pendingMedia.progress}%
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSendMedia}
                    disabled={isSendingAny}
                    data-ocid="chat.submit_button"
                    className="w-full h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    {isSendingAny ? "Sending…" : "Send"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice recording indicator */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg"
                >
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="w-2 h-2 rounded-full bg-destructive flex-shrink-0"
                  />
                  <span className="text-xs font-medium text-destructive">
                    Recording
                  </span>
                  <span className="text-xs text-destructive/70 tabular-nums">
                    {formatDuration(recordSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="ml-auto flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    Stop
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text input row */}
            {!pendingMedia && (
              <div className="flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Say something…"
                  data-ocid="chat.input"
                  className="flex-1 h-9 text-sm bg-muted border-input"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isSendingAny || !text.trim()}
                  data-ocid="chat.submit_button"
                  className="w-9 h-9 bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Media toolbar */}
            {!pendingMedia && !isRecording && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground mr-0.5">
                  Attach:
                </span>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  data-ocid="chat.upload_button"
                  title="Upload image"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  title="Upload video"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>

                <button
                  type="button"
                  onClick={startRecording}
                  title="Record voice message"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice</span>
                </button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "image")}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "video")}
            />
          </>
        )}
      </div>
    </div>
  );
}
