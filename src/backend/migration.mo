import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  // Original Actor and nested types
  type OldActor = {
    users : Map.Map<Principal, UserProfile>;
    mediaItems : Map.Map<Nat, MediaItem>;
    chatMessages : List.List<ChatMessage>;
    reactions : List.List<Reaction>;
    handRaises : Map.Map<Principal, Bool>;
    mutedChatUsers : Map.Map<Principal, Bool>;
    mutedReactionUsers : Map.Map<Principal, Bool>;
    nextMediaId : Nat;
    nextMessageId : Nat;
    nextReactionId : Nat;
    playbackState : PlaybackState;
  };

  type UserProfile = {
    principal : Principal;
    displayName : Text;
  };

  type MediaType = {
    #uploadedFile : Storage.ExternalBlob;
    #externalUrl : Text;
  };

  type MediaItem = {
    id : Nat;
    title : Text;
    mediaType : MediaType;
    metadata : ?Text;
  };

  type PlaybackState = {
    currentMediaId : Nat;
    position : Nat;
    isPlaying : Bool;
    lastUpdate : Time.Time;
  };

  type ChatMessage = {
    id : Nat;
    sender : Principal;
    displayName : Text;
    text : Text;
    timestamp : Time.Time;
  };

  type Reaction = {
    emoji : Text;
    sender : Principal;
    displayName : Text;
    timestamp : Time.Time;
  };

  // New persistent actor and types
  type Attachment = {
    kind : MediaKind;
    blob : Storage.ExternalBlob;
    caption : ?Text;
  };

  type MediaKind = {
    #image;
    #video;
    #audio;
  };

  type NewActor = {
    users : Map.Map<Principal, UserProfile>;
    mediaItems : Map.Map<Nat, MediaItem>;
    chatMessages : List.List<NewChatMessage>;
    reactions : List.List<Reaction>;
    handRaises : Map.Map<Principal, Bool>;
    mutedChatUsers : Map.Map<Principal, Bool>;
    mutedReactionUsers : Map.Map<Principal, Bool>;
    nextMediaId : Nat;
    nextMessageId : Nat;
    nextReactionId : Nat;
    playbackState : PlaybackState;
  };

  type NewChatMessage = {
    id : Nat;
    sender : Principal;
    displayName : Text;
    text : ?Text;
    timestamp : Time.Time;
    attachment : ?Attachment;
  };

  public func run(old : OldActor) : NewActor {
    let newChatMessages = old.chatMessages.map<ChatMessage, NewChatMessage>(
      func(oldMsg) {
        {
          oldMsg with
          text = ?oldMsg.text;
          attachment = null;
        };
      }
    );

    {
      old with
      chatMessages = newChatMessages;
    };
  };
};
