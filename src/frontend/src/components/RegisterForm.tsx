import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Film, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterUser } from "../hooks/useQueries";

interface Props {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const { mutateAsync: registerUser, isPending } = useRegisterUser();
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await registerUser(name.trim());
      toast.success("Welcome to the party!");
      onSuccess();
    } catch {
      toast.error("Failed to register. Please try again.");
    }
  };

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.76 0.14 68 / 0.06) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Group Watch Party
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-panel">
          <h2 className="font-display font-bold text-xl text-foreground mb-1">
            Choose your name
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            This is how you&apos;ll appear in chat and to the admin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="display-name"
                className="text-sm font-medium text-foreground mb-1.5 block"
              >
                Display Name
              </Label>
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name…"
                maxLength={50}
                data-ocid="auth.register_input"
                className="bg-muted border-input text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              data-ocid="auth.register_submit_button"
              className="w-full h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Joining…
                </>
              ) : (
                "Enter the Party"
              )}
            </Button>
          </form>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out and use a different account
        </button>
      </motion.div>
    </div>
  );
}
