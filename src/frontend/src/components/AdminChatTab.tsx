import type { UserProfile } from "../backend";
import ChatPanel from "./ChatPanel";

interface Props {
  userProfile: UserProfile;
}

export default function AdminChatTab({ userProfile }: Props) {
  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden"
      style={{ height: "calc(100vh - 220px)" }}
    >
      <ChatPanel userProfile={userProfile} isAdmin />
    </div>
  );
}
