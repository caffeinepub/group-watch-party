import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import List "mo:core/List";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  //------------------------------------
  // Types
  //------------------------------------
  type DisplayName = Text;
  type Seconds = Nat;

  public type MediaType = {
    #uploadedFile : Storage.ExternalBlob;
    #externalUrl : Text;
  };

  public type MediaItem = {
    id : Nat;
    title : Text;
    mediaType : MediaType;
    metadata : ?Text;
  };

  public type PlaybackState = {
    currentMediaId : Nat;
    position : Seconds;
    isPlaying : Bool;
    lastUpdate : Time.Time;
  };

  public type ChatMessage = {
    id : Nat;
    sender : Principal;
    displayName : DisplayName;
    text : Text;
    timestamp : Time.Time;
  };

  public type UserProfile = {
    principal : Principal;
    displayName : DisplayName;
  };

  module MediaItem {
    public func compare(a : MediaItem, b : MediaItem) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module ChatMessage {
    public func compare(a : ChatMessage, b : ChatMessage) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  //------------------------------------
  // State
  //------------------------------------
  var nextMediaId : Nat = 1;
  var nextMessageId : Nat = 1;

  var playbackState : PlaybackState = {
    currentMediaId = 0;
    position = 0;
    isPlaying = false;
    lastUpdate = 0;
  };

  let users = Map.empty<Principal, UserProfile>();
  let mediaItems = Map.empty<Nat, MediaItem>();
  let chatMessages = List.empty<ChatMessage>();

  //------------------------------------
  // User Management
  //------------------------------------
  public shared ({ caller }) func registerUser(displayName : DisplayName) : async () {
    // Allow any authenticated user (not guest) to register
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot register");
    };
    if (displayName.size() >= 32) {
      Runtime.trap("Display name cannot be longer than 32 characters");
    };

    let newUser : UserProfile = {
      principal = caller;
      displayName;
    };
    users.add(caller, newUser);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (users.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can list all users");
    };
    users.values().toArray().map(func(u) { u });
  };

  public shared ({ caller }) func removeUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can remove users");
    };
    users.remove(user);
  };

  //------------------------------------
  // Media Library
  //------------------------------------
  public shared ({ caller }) func addMediaItem(
    title : Text,
    mediaType : MediaType,
    metadata : ?Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can add media");
    };
    if (title.size() >= 64) {
      Runtime.trap("Title must be 64 chars or less");
    };
    let id = nextMediaId;
    nextMediaId += 1;

    let item : MediaItem = {
      id;
      title;
      mediaType;
      metadata;
    };

    mediaItems.add(id, item);
    id;
  };

  public query ({ caller }) func getMediaItem(id : Nat) : async MediaItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view media items");
    };
    switch (mediaItems.get(id)) {
      case (null) { Runtime.trap("Media item not found") };
      case (?item) { item };
    };
  };

  public query ({ caller }) func getAllMediaItems() : async [MediaItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view media items");
    };
    mediaItems.values().toArray().map(func(item) { item });
  };

  public shared ({ caller }) func deleteMediaItem(mediaId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete media");
    };
    mediaItems.remove(mediaId);
  };

  //------------------------------------
  // Playback State
  //------------------------------------
  public shared ({ caller }) func updatePlaybackState(
    currentMediaId : Nat,
    position : Seconds,
    isPlaying : Bool,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can update playback");
    };

    let updatedState : PlaybackState = {
      currentMediaId;
      position;
      isPlaying;
      lastUpdate = Time.now();
    };

    playbackState := updatedState;
  };

  public query ({ caller }) func getPlaybackState() : async PlaybackState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view playback state");
    };
    playbackState;
  };

  //------------------------------------
  // Group Chat
  //------------------------------------
  public shared ({ caller }) func sendMessage(displayName : DisplayName, text : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: You must be logged in to send messages");
    };
    if (text.size() >= 512) {
      Runtime.trap("Message text must be less than 512 chars");
    };
    if (displayName.size() >= 32) {
      Runtime.trap("Display name must be less than 32 chars");
    };

    let newMessage : ChatMessage = {
      id = nextMessageId;
      sender = caller;
      displayName;
      text;
      timestamp = Time.now();
    };
    chatMessages.add(newMessage);
    nextMessageId += 1;
    nextMessageId - 1;
  };

  public query ({ caller }) func getAllMessages() : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };
    chatMessages.toArray().sort();
  };

  public shared ({ caller }) func deleteMessage(messageId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete messages");
    };

    let filteredMessages = chatMessages.filter(func(msg) { msg.id != messageId });

    chatMessages.clear();
    chatMessages.addAll(filteredMessages.reverse().values());
  };
};
