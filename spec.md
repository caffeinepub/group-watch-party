# Group Watch Party

## Current State
A real-time group watch party app with:
- Internet Identity authentication and user registration
- External video URL playback (YouTube, Vimeo, MP4, etc.)
- Live text chat (polling-based)
- Emoji reactions with floating animations, hand-raise, reaction counters
- Admin panel with 5 tabs: watch party, media library, users, chat, reactions
- Blob storage component already included in backend
- Chat messages are text-only with fields: id, sender, displayName, text, timestamp

## Requested Changes (Diff)

### Add
- Image upload in chat (any user can upload and share an image in the chat)
- Video upload in chat (any user can upload and share a video file in the chat)
- Voice message recording and sharing in chat (record, preview, send as inline playable audio)
- Media message type extending ChatMessage: supports text, image blob, video blob, audio blob
- Media gallery tab in chat showing all shared images/videos from chat history

### Modify
- `ChatMessage` type to include optional media attachment (blobId referencing blob-storage, mediaKind: image|video|audio)
- `sendMessage` backend function or new `sendMediaMessage` function to accept blob attachment info
- `ChatPanel` component: add toolbar with image upload button, video upload button, microphone record button, file preview before send, and inline rendering of image/video/audio in messages

### Remove
- Nothing removed

## Implementation Plan
1. Update backend `ChatMessage` type to include optional `attachment: ?{ blobId: Text; kind: #image | #video | #audio }`
2. Add `sendMediaMessage` backend function accepting displayName, text (optional caption), blobId, and media kind
3. Frontend: add upload helpers using blob-storage SDK to upload file and get blobId
4. Update `ChatPanel` to show upload/record toolbar below the text input
5. Voice recording: use MediaRecorder API to record audio, encode to blob, upload via blob-storage, then call sendMediaMessage
6. Inline rendering: images show as thumbnails, videos show as small inline player, audio shows as compact audio player
7. Add `useGetAllMessages` to refetch after media message is sent
