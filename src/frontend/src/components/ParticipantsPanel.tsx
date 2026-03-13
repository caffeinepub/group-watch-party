import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Principal } from "@icp-sdk/core/principal";
import { Hand, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import {
  useGetAllUsers,
  useGetHandRaises,
  useLowerHand,
  useToggleHandRaise,
} from "../hooks/useQueries";

interface Props {
  userProfile: UserProfile;
  isAdmin?: boolean;
}

export default function ParticipantsPanel({ userProfile, isAdmin }: Props) {
  const { data: users = [] } = useGetAllUsers();
  const { data: handRaises = [] } = useGetHandRaises();
  const { mutateAsync: toggleHand, isPending: togglingHand } =
    useToggleHandRaise();
  const { mutateAsync: lowerHand } = useLowerHand();

  const raisedSet = new Set<string>(
    handRaises.filter(([, raised]) => raised).map(([p]) => p.toString()),
  );

  const myPrincipal = userProfile.principal.toString();
  const myHandRaised = raisedSet.has(myPrincipal);

  const handleToggleHand = async () => {
    try {
      await toggleHand(userProfile.displayName);
    } catch {
      toast.error("Failed to update hand raise");
    }
  };

  const handleLowerHand = async (principal: Principal) => {
    try {
      await lowerHand(principal);
    } catch {
      toast.error("Failed to lower hand");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <span className="font-display font-semibold text-sm text-foreground">
          Participants
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {users.length}
        </span>
      </div>

      {/* Hand raise button */}
      <div className="px-3 py-2 border-b border-border/20">
        <Button
          variant={myHandRaised ? "default" : "outline"}
          size="sm"
          onClick={handleToggleHand}
          disabled={togglingHand}
          data-ocid="hand.raise.toggle"
          className={`w-full h-8 text-xs font-semibold transition-all ${
            myHandRaised
              ? "bg-amber-500 hover:bg-amber-600 text-black border-0"
              : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
          }`}
        >
          <span className="mr-1.5">{myHandRaised ? "✋" : "🤚"}</span>
          {myHandRaised ? "Lower Hand" : "Raise Hand"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        {users.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-24 text-center"
            data-ocid="participants.empty_state"
          >
            <p className="text-xs text-muted-foreground">No participants yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {users.map((user) => {
              const isRaised = raisedSet.has(user.principal.toString());
              const isMe = user.principal.toString() === myPrincipal;
              return (
                <div
                  key={user.principal.toString()}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {user.displayName}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <Shield className="w-3 h-3 text-primary opacity-70" />
                    )}
                    {isRaised && (
                      <span className="text-base" title="Hand raised">
                        ✋
                      </span>
                    )}
                    {isAdmin && isRaised && (
                      <button
                        type="button"
                        onClick={() => handleLowerHand(user.principal)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive transition-all"
                        title="Lower hand"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {raisedSet.size > 0 && (
          <>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground px-2">
              {raisedSet.size} hand{raisedSet.size > 1 ? "s" : ""} raised
            </p>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
