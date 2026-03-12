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
export type Seconds = bigint;
export type Time = bigint;
export interface ChatMessage {
    id: bigint;
    displayName: DisplayName;
    text: string;
    sender: Principal;
    timestamp: Time;
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
export interface MediaItem {
    id: bigint;
    title: string;
    metadata?: string;
    mediaType: MediaType;
}
export interface UserProfile {
    principal: Principal;
    displayName: DisplayName;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMediaItem(title: string, mediaType: MediaType, metadata: string | null): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteMediaItem(mediaId: bigint): Promise<void>;
    deleteMessage(messageId: bigint): Promise<void>;
    getAllMediaItems(): Promise<Array<MediaItem>>;
    getAllMessages(): Promise<Array<ChatMessage>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMediaItem(id: bigint): Promise<MediaItem>;
    getPlaybackState(): Promise<PlaybackState>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    registerUser(displayName: DisplayName): Promise<void>;
    removeUser(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(displayName: DisplayName, text: string): Promise<bigint>;
    updatePlaybackState(currentMediaId: bigint, position: Seconds, isPlaying: boolean): Promise<void>;
}
