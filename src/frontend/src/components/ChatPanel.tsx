import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import {
  useDeleteMessage,
  useGetAllMessages,
  useSendMessage,
} from "../hooks/useQueries";

interface Props {
  userProfile: UserProfile;
  isAdmin?: boolean;
}

function formatRelTime(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

export default function ChatPanel({ userProfile, isAdmin }: Props) {
  const { data: messages = [] } = useGetAllMessages();
  const { mutateAsync: sendMessage, isPending: sending } = useSendMessage();
  const { mutateAsync: deleteMessage } = useDeleteMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgCount = messages.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgCount]);

  const handleSend = async () => {
    if (!text.trim()) return;
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

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="font-display font-semibold text-sm text-foreground">
          Live Chat
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {messages.length} messages
        </span>
      </div>

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
                  <p className="text-sm text-foreground leading-snug break-words">
                    {msg.text}
                  </p>
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

      <div className="px-3 py-3 border-t border-border/40">
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
            data-ocid="chat.message_input"
            className="flex-1 h-9 text-sm bg-muted border-input"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            data-ocid="chat.send_button"
            className="w-9 h-9 bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
