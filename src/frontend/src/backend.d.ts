import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type DisplayName = string;
export type Time = bigint;
export interface MediaItem {
    id: bigint;
    title: string;
    metadata?: string;
    mediaType: MediaType;
}
export type Seconds = bigint;
export interface Attachment {
    blob: ExternalBlob;
    kind: MediaKind;
    caption?: string;
}
export interface ChatMessage {
    id: bigint;
    displayName: DisplayName;
    text?: string;
    sender: Principal;
    timestamp: Time;
    attachment?: Attachment;
}
export interface PlaybackState {
    lastUpdate: Time;
    isPlaying: boolean;
    position: Seconds;
    currentMediaId: bigint;
}
export type MediaType = {
    __kind__: "uploadedFile";
    uploadedFile: ExternalBlob;
} | {
    __kind__: "externalUrl";
    externalUrl: string;
};
export interface UserProfile {
    principal: Principal;
    displayName: DisplayName;
}
export interface Reaction {
    displayName: DisplayName;
    sender: Principal;
    emoji: string;
    timestamp: Time;
}
export enum MediaKind {
    audio = "audio",
    video = "video",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMediaItem(title: string, mediaType: MediaType, metadata: string | null): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearReactions(): Promise<void>;
    deleteMediaItem(mediaId: bigint): Promise<void>;
    deleteMessage(messageId: bigint): Promise<void>;
    getAllMediaItems(): Promise<Array<MediaItem>>;
    getAllMessages(): Promise<Array<ChatMessage>>;
    getAllReactions(): Promise<Array<Reaction>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHandRaises(): Promise<Array<[Principal, boolean]>>;
    getMediaItem(id: bigint): Promise<MediaItem>;
    getMutedChatUsers(): Promise<Array<Principal>>;
    getMutedReactionUsers(): Promise<Array<Principal>>;
    getPlaybackState(): Promise<PlaybackState>;
    getReactionCounts(): Promise<Array<[string, bigint]>>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    lowerHand(user: Principal): Promise<void>;
    muteUserFromChat(user: Principal): Promise<void>;
    muteUserFromReactions(user: Principal): Promise<void>;
    registerUser(displayName: DisplayName): Promise<void>;
    removeUser(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMediaMessage(displayName: string, caption: string | null, blob: ExternalBlob, kind: MediaKind): Promise<bigint>;
    sendMessage(displayName: DisplayName, text: string): Promise<bigint>;
    sendReaction(emoji: string, displayName: DisplayName): Promise<void>;
    toggleHandRaise(displayName: DisplayName): Promise<void>;
    unmuteUserFromChat(user: Principal): Promise<void>;
    unmuteUserFromReactions(user: Principal): Promise<void>;
    updatePlaybackState(currentMediaId: bigint, position: Seconds, isPlaying: boolean): Promise<void>;
}
