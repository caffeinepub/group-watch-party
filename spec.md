# Group Watch Party

## Current State
The project has the base Caffeine scaffold with no backend Motoko code and no App.tsx. The previous build failed before generating any application code.

## Requested Changes (Diff)

### Add
- Role-based authorization: Super Admin (s73590363@gmail.com principal-based) and Viewer roles
- Media management: upload photos and videos via blob storage, add external video URLs (YouTube, etc.)
- Watch party system: admin controls playback (play/pause/seek/current media), all viewers see synced state
- Live group chat: all authenticated users can send messages, visible in real-time (polling)
- Super Admin panel: manage media library (upload/delete), control playback, manage users, moderate chat
- Viewer UI: watch synced media, participate in chat (read + send messages)

### Modify
- Nothing (new build)

### Remove
- Nothing

## Implementation Plan
1. Select `authorization` and `blob-storage` components
2. Generate Motoko backend with:
   - User role management (admin check by principal text match)
   - Media items: stored files (blob refs) and external URLs with metadata
   - Watch party session state: currentMediaId, playbackPosition, isPlaying, lastUpdated
   - Chat messages: sender, text, timestamp
   - CRUD for media (admin only), update session state (admin only), send chat message (any authed user), read all (public/authed)
3. Build frontend:
   - Internet Identity login
   - Admin view: media library with upload/add URL, playback controls, user list, chat moderation
   - Viewer view: synced media player (polls session state), chat panel
   - Responsive layout with real-time feel via polling
