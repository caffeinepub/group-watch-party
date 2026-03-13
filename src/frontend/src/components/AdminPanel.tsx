import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Film,
  Link,
  Loader2,
  MessageCircle,
  MessageSquareOff,
  Mic,
  MicOff,
  Play,
  Plus,
  Settings,
  SmilePlus,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import {
  useAddMediaItem,
  useClearReactions,
  useDeleteMediaItem,
  useDeleteMessage,
  useGetAllMediaItems,
  useGetAllMessages,
  useGetAllUsers,
  useGetMutedChatUsers,
  useGetMutedReactionUsers,
  useGetPlaybackState,
  useGetReactionCounts,
  useMuteUserFromChat,
  useMuteUserFromReactions,
  useRemoveUser,
  useUnmuteUserFromChat,
  useUnmuteUserFromReactions,
  useUpdatePlaybackState,
} from "../hooks/useQueries";

interface Props {
  userProfile: UserProfile;
  currentMediaId?: bigint;
  currentPosition: number;
  isPlaying: boolean;
}

function formatRelTime(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function AdminPanel({
  userProfile: _userProfile,
  currentMediaId,
  currentPosition,
  isPlaying,
}: Props) {
  const [open, setOpen] = useState(false);

  const { data: mediaItems = [] } = useGetAllMediaItems();
  const { data: playbackState } = useGetPlaybackState();
  const { data: users = [] } = useGetAllUsers();
  const { data: messages = [] } = useGetAllMessages();
  const { data: reactionCounts = [] } = useGetReactionCounts();
  const { data: mutedChatUsers = [] } = useGetMutedChatUsers();
  const { data: mutedReactionUsers = [] } = useGetMutedReactionUsers();

  const { mutateAsync: addMedia, isPending: adding } = useAddMediaItem();
  const { mutateAsync: deleteMedia } = useDeleteMediaItem();
  const { mutateAsync: updatePlayback, isPending: updatingPlayback } =
    useUpdatePlaybackState();
  const { mutateAsync: removeUser } = useRemoveUser();
  const { mutateAsync: deleteMessage } = useDeleteMessage();
  const { mutateAsync: clearReactions, isPending: clearingReactions } =
    useClearReactions();
  const { mutateAsync: muteChat } = useMuteUserFromChat();
  const { mutateAsync: unmuteChat } = useUnmuteUserFromChat();
  const { mutateAsync: muteReactions } = useMuteUserFromReactions();
  const { mutateAsync: unmuteReactions } = useUnmuteUserFromReactions();

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const mutedChatSet = new Set(mutedChatUsers.map((p) => p.toString()));
  const mutedReactionSet = new Set(mutedReactionUsers.map((p) => p.toString()));

  const handleAddMedia = async () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error("Enter a title and URL");
      return;
    }
    try {
      const id = await addMedia({
        title: newTitle.trim(),
        mediaType: { __kind__: "externalUrl", externalUrl: newUrl.trim() },
        metadata: null,
      });
      await updatePlayback({
        currentMediaId: id,
        position: 0n,
        isPlaying: false,
      });
      setNewTitle("");
      setNewUrl("");
      toast.success("Media added and set as active!");
    } catch {
      toast.error("Failed to add media");
    }
  };

  const handleSetActive = async (mediaId: bigint) => {
    try {
      await updatePlayback({
        currentMediaId: mediaId,
        position: 0n,
        isPlaying: false,
      });
      toast.success("Media set as active");
    } catch {
      toast.error("Failed to set active media");
    }
  };

  const handlePlayPause = async () => {
    const mediaId = currentMediaId ?? playbackState?.currentMediaId ?? 0n;
    try {
      await updatePlayback({
        currentMediaId: mediaId,
        position: BigInt(Math.floor(currentPosition)),
        isPlaying: !isPlaying,
      });
    } catch {
      toast.error("Failed to update playback");
    }
  };

  const handleRemoveUser = async (principal: Principal) => {
    try {
      await removeUser(principal);
      toast.success("User removed");
    } catch {
      toast.error("Failed to remove user");
    }
  };

  const handleDeleteMessage = async (id: bigint) => {
    try {
      await deleteMessage(id);
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleClearReactions = async () => {
    try {
      await clearReactions();
      toast.success("All reactions cleared");
    } catch {
      toast.error("Failed to clear reactions");
    }
  };

  const toggleChatMute = async (principal: Principal) => {
    const key = principal.toString();
    try {
      if (mutedChatSet.has(key)) {
        await unmuteChat(principal);
        toast.success("User unmuted from chat");
      } else {
        await muteChat(principal);
        toast.success("User muted from chat");
      }
    } catch {
      toast.error("Failed to update mute status");
    }
  };

  const toggleReactionMute = async (principal: Principal) => {
    const key = principal.toString();
    try {
      if (mutedReactionSet.has(key)) {
        await unmuteReactions(principal);
        toast.success("User unmuted from reactions");
      } else {
        await muteReactions(principal);
        toast.success("User muted from reactions");
      }
    } catch {
      toast.error("Failed to update mute status");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-ocid="admin.panel.button"
          className="h-8 px-3 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 gap-1.5"
        >
          <Settings className="w-3.5 h-3.5" />
          Admin Panel
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-card border-border flex flex-col p-0"
        data-ocid="admin.panel"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <SheetTitle className="font-display font-bold text-foreground text-lg">
            Admin Panel
          </SheetTitle>
        </SheetHeader>

        <Tabs
          defaultValue="media"
          className="flex flex-col flex-1 overflow-hidden"
        >
          <TabsList className="mx-5 mt-3 mb-2 bg-muted h-9 grid grid-cols-5 flex-shrink-0">
            <TabsTrigger
              value="media"
              data-ocid="admin.tab.1"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Film className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger
              value="playback"
              data-ocid="admin.tab.2"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Play className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-ocid="admin.tab.3"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger
              value="reactions"
              data-ocid="admin.tab.4"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <SmilePlus className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              data-ocid="admin.tab.5"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MessageCircle className="w-3 h-3" />
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Media Queue */}
          <TabsContent
            value="media"
            className="flex-1 overflow-hidden flex flex-col mt-0 px-5"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Media Queue
            </p>
            <div className="space-y-2 mb-4">
              <div>
                <Label className="text-xs mb-1 block">Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Video title\u2026"
                  data-ocid="admin.media.input"
                  className="h-8 text-sm bg-muted border-input"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">URL</Label>
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=\u2026"
                  data-ocid="video.url.input"
                  className="h-8 text-sm bg-muted border-input"
                />
              </div>
              <Button
                onClick={handleAddMedia}
                disabled={adding}
                data-ocid="admin.media.submit_button"
                className="w-full h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              >
                {adding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                )}
                Add &amp; Set Active
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {mediaItems.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center h-24 text-center border border-dashed border-border rounded-xl"
                    data-ocid="media.empty_state"
                  >
                    <Film className="w-6 h-6 text-muted-foreground/30 mb-1" />
                    <p className="text-xs text-muted-foreground">
                      No media added yet
                    </p>
                  </div>
                ) : (
                  mediaItems.map((item, i) => (
                    <div
                      key={item.id.toString()}
                      data-ocid={`media.item.${i + 1}`}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors group cursor-pointer ${
                        item.id === currentMediaId
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted/40"
                      }`}
                      onClick={() => handleSetActive(item.id)}
                      role="presentation"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSetActive(item.id)
                      }
                    >
                      <div className="w-7 h-7 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        {item.mediaType.__kind__ === "externalUrl" ? (
                          <Link className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Film className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="flex-1 text-sm text-foreground truncate">
                        {item.title}
                      </span>
                      {item.id === currentMediaId && (
                        <Badge className="text-[10px] h-4 bg-primary text-primary-foreground border-0 flex-shrink-0">
                          Live
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMedia(item.id);
                        }}
                        data-ocid={`media.delete_button.${i + 1}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-destructive hover:bg-destructive/10 transition-all"
                        title="Delete media item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab 2: Playback */}
          <TabsContent
            value="playback"
            className="flex-1 overflow-auto mt-0 px-5"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Playback Control
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground mb-1">
                  Current Media
                </p>
                <p className="font-semibold text-foreground text-sm">
                  {mediaItems.find((m) => m.id === currentMediaId)?.title ??
                    "None selected"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${isPlaying ? "bg-primary animate-pulse" : "bg-muted-foreground"}`}
                  />
                  <span className="text-sm font-medium">
                    {isPlaying ? "Playing" : "Paused"}
                  </span>
                </div>
              </div>
              <Button
                onClick={handlePlayPause}
                disabled={updatingPlayback || !currentMediaId}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {updatingPlayback ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : isPlaying ? (
                  "Pause for Everyone"
                ) : (
                  "Play for Everyone"
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: Users */}
          <TabsContent
            value="users"
            className="flex-1 overflow-hidden flex flex-col mt-0 px-5"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Users ({users.length})
            </p>
            <ScrollArea className="flex-1">
              {users.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-24 text-center"
                  data-ocid="users.empty_state"
                >
                  <p className="text-xs text-muted-foreground">No users yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">
                        Name
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground text-center">
                        Chat
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground text-center">
                        React
                      </TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, i) => {
                      const pStr = user.principal.toString();
                      const chatMuted = mutedChatSet.has(pStr);
                      const reactionMuted = mutedReactionSet.has(pStr);
                      return (
                        <TableRow
                          key={pStr}
                          data-ocid={`users.item.${i + 1}`}
                          className="border-border hover:bg-muted/30"
                        >
                          <TableCell className="py-2 text-sm font-medium text-foreground">
                            {user.displayName}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleChatMute(user.principal)}
                              title={chatMuted ? "Unmute chat" : "Mute chat"}
                              className={`p-1 rounded transition-colors ${
                                chatMuted
                                  ? "text-destructive hover:bg-destructive/10"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                            >
                              {chatMuted ? (
                                <MessageSquareOff className="w-3.5 h-3.5" />
                              ) : (
                                <MessageCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleReactionMute(user.principal)}
                              title={
                                reactionMuted
                                  ? "Unmute reactions"
                                  : "Mute reactions"
                              }
                              className={`p-1 rounded transition-colors ${
                                reactionMuted
                                  ? "text-destructive hover:bg-destructive/10"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                            >
                              {reactionMuted ? (
                                <MicOff className="w-3.5 h-3.5" />
                              ) : (
                                <Mic className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(user.principal)}
                              data-ocid={`users.delete_button.${i + 1}`}
                              className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                              title="Remove user"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab 4: Reactions */}
          <TabsContent
            value="reactions"
            className="flex-1 overflow-auto mt-0 px-5"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Reactions
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {reactionCounts.map(([emoji, count]) => (
                  <div
                    key={emoji}
                    className="flex flex-col items-center gap-1 p-3 bg-muted/40 rounded-xl border border-border"
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-sm font-bold text-foreground">
                      {Number(count)}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleClearReactions}
                disabled={clearingReactions}
                variant="destructive"
                data-ocid="admin.reactions.clear_button"
                className="w-full"
              >
                {clearingReactions ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear All Reactions
              </Button>
            </div>
          </TabsContent>

          {/* Tab 5: Chat */}
          <TabsContent
            value="chat"
            className="flex-1 overflow-hidden flex flex-col mt-0 px-5"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Chat Messages ({messages.length})
            </p>
            <ScrollArea className="flex-1">
              {messages.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-24 text-center"
                  data-ocid="chat.empty_state"
                >
                  <p className="text-xs text-muted-foreground">
                    No messages yet
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg, i) => (
                    <div
                      key={msg.id.toString()}
                      data-ocid={`chat.item.${i + 1}`}
                      className="group flex items-start gap-2 py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold text-primary">
                            {msg.displayName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelTime(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-snug break-words">
                          {msg.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        data-ocid={`chat.delete_button.${i + 1}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
