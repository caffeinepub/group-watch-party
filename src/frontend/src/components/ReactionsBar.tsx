import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useGetReactionCounts, useSendReaction } from "../hooks/useQueries";

const EMOJIS = [
  { emoji: "🎉", label: "Party" },
  { emoji: "🤣", label: "LOL" },
  { emoji: "👏", label: "Clap" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "❤️", label: "Love" },
  { emoji: "😮", label: "Wow" },
  { emoji: "👍", label: "Like" },
];

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

interface Props {
  userProfile: UserProfile;
  isMuted?: boolean;
}

export default function ReactionsBar({ userProfile, isMuted }: Props) {
  const { data: reactionCounts = [] } = useGetReactionCounts();
  const { mutateAsync: sendReaction, isPending } = useSendReaction();
  const [floaters, setFloaters] = useState<FloatingReaction[]>([]);
  const cleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup old floaters
  useEffect(() => {
    if (floaters.length > 0) {
      cleanupRef.current = setTimeout(() => {
        setFloaters((prev) => prev.slice(-8));
      }, 3000);
    }
    return () => {
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
    };
  }, [floaters.length]);

  const handleReaction = async (emoji: string) => {
    if (isMuted) {
      toast.error("You are muted from reactions");
      return;
    }
    // Spawn floater immediately
    const id = `${Date.now()}-${Math.random()}`;
    const x = 40 + Math.random() * 20; // 40-60% from left
    setFloaters((prev) => [...prev, { id, emoji, x }]);

    try {
      await sendReaction({ emoji, displayName: userProfile.displayName });
    } catch {
      // silent fail on reaction
    }
  };

  const countMap = new Map<string, number>();
  for (const [emoji, count] of reactionCounts) {
    countMap.set(emoji, Number(count));
  }

  return (
    <div className="relative">
      {/* Floating reactions container - absolutely positioned over parent */}
      <div
        className="absolute bottom-full left-0 right-0 pointer-events-none overflow-hidden"
        style={{ height: "300px" }}
      >
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -280, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute bottom-0 text-3xl select-none"
              style={{ left: `${f.x}%` }}
            >
              {f.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction bar */}
      <div className="flex items-center justify-center gap-1 py-2 px-3 bg-card/80 backdrop-blur-sm border-t border-border/40">
        {EMOJIS.map(({ emoji, label }, idx) => {
          const count = countMap.get(emoji) ?? 0;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleReaction(emoji)}
              disabled={isPending}
              data-ocid={`reaction.button.${idx + 1}`}
              title={label}
              className="group relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="text-xl group-hover:scale-125 transition-transform">
                {emoji}
              </span>
              {count > 0 && (
                <span className="text-[10px] font-bold text-primary leading-none">
                  {count > 999 ? "999+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reaction counts row */}
      {reactionCounts.some(([, c]) => Number(c) > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-muted/40 border-t border-border/20">
          {reactionCounts
            .filter(([, c]) => Number(c) > 0)
            .sort((a, b) => Number(b[1]) - Number(a[1]))
            .slice(0, 7)
            .map(([emoji, count]) => (
              <span
                key={emoji}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <span>{emoji}</span>
                <span className="font-semibold text-foreground">
                  {Number(count)}
                </span>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
