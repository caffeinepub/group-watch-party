import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import AdminView from "./components/AdminView";
import LandingPage from "./components/LandingPage";
import RegisterForm from "./components/RegisterForm";
import ViewerView from "./components/ViewerView";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "./hooks/useQueries";

export default function App() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  const qc = useQueryClient();

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage />
        <Toaster />
      </>
    );
  }

  if (
    profileLoading ||
    !isFetched ||
    (isAuthenticated && adminLoading && userProfile)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const needsRegistration =
    isAuthenticated && isFetched && userProfile === null;
  if (needsRegistration) {
    return (
      <>
        <RegisterForm
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
            qc.invalidateQueries({ queryKey: ["isCallerAdmin"] });
          }}
        />
        <Toaster />
      </>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {isAdmin ? (
        <AdminView userProfile={userProfile} />
      ) : (
        <ViewerView userProfile={userProfile} />
      )}
      <Toaster />
    </>
  );
}
