import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChatMessage,
  ExternalBlob,
  MediaItem,
  MediaKind,
  MediaType,
  PlaybackState,
  Reaction,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAllMediaItems() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<MediaItem[]>({
    queryKey: ["mediaItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMediaItems();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000,
  });
}

export function useGetAllMessages() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ["allMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessages();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 3000,
  });
}

export function useGetPlaybackState() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<PlaybackState | null>({
    queryKey: ["playbackState"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPlaybackState();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 2000,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000,
  });
}

export function useGetAllReactions() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Reaction[]>({
    queryKey: ["allReactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReactions();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 3000,
  });
}

export function useGetReactionCounts() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["reactionCounts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReactionCounts();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 3000,
  });
}

export function useGetHandRaises() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Array<[Principal, boolean]>>({
    queryKey: ["handRaises"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHandRaises();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 5000,
  });
}

export function useGetMutedChatUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["mutedChatUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMutedChatUsers();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000,
  });
}

export function useGetMutedReactionUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["mutedReactionUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMutedReactionUsers();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.registerUser(displayName);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      displayName,
      text,
    }: { displayName: string; text: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendMessage(displayName, text);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMessages"] });
    },
  });
}

export function useSendMediaMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      displayName,
      caption,
      blob,
      kind,
    }: {
      displayName: string;
      caption: string | null;
      blob: ExternalBlob;
      kind: MediaKind;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendMediaMessage(displayName, caption, blob, kind);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMessages"] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteMessage(messageId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMessages"] });
    },
  });
}

export function useAddMediaItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      mediaType,
      metadata,
    }: { title: string; mediaType: MediaType; metadata: string | null }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addMediaItem(title, mediaType, metadata);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mediaItems"] });
    },
  });
}

export function useDeleteMediaItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteMediaItem(mediaId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mediaItems"] });
    },
  });
}

export function useUpdatePlaybackState() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      currentMediaId,
      position,
      isPlaying,
    }: { currentMediaId: bigint; position: bigint; isPlaying: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updatePlaybackState(currentMediaId, position, isPlaying);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbackState"] });
    },
  });
}

export function useRemoveUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not available");
      await actor.removeUser(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useSendReaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      emoji,
      displayName,
    }: { emoji: string; displayName: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.sendReaction(emoji, displayName);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reactionCounts"] });
      qc.invalidateQueries({ queryKey: ["allReactions"] });
    },
  });
}

export function useClearReactions() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.clearReactions();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reactionCounts"] });
      qc.invalidateQueries({ queryKey: ["allReactions"] });
    },
  });
}

export function useToggleHandRaise() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.toggleHandRaise(displayName);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["handRaises"] });
    },
  });
}

export function useLowerHand() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not available");
      await actor.lowerHand(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["handRaises"] });
    },
  });
}

export function useMuteUserFromChat() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not available");
      await actor.muteUserFromChat(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mutedChatUsers"] });
    },
  });
}

export function useUnmuteUserFromChat() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not available");
      await actor.unmuteUserFromChat(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mutedChatUsers"] });
    },
  });
}

export function useMuteUserFromReactions() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not available");
      await actor.muteUserFromReactions(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mutedReactionUsers"] });
    },
  });
}

export function useUnmuteUserFromReactions() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not available");
      await actor.unmuteUserFromReactions(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mutedReactionUsers"] });
    },
  });
}
