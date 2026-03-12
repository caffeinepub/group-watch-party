import { Button } from "@/components/ui/button";
import { Film, Loader2, MessageCircle, Play, Users } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Film grain overlay */}
      <div className="fixed inset-0 film-grain opacity-40 pointer-events-none z-0" />

      {/* Radial glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.76 0.14 68 / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              Group Watch Party
            </span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-amber" />
              Private Screening Room
            </motion.div>

            <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-tight text-foreground mb-6">
              Watch Together,{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.76 0.14 68), oklch(0.65 0.12 62))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Perfectly
                <br />
                Synced
              </span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-10 max-w-lg mx-auto">
              A private screening room for your group. Admin controls playback,
              everyone watches in sync with live chat.
            </p>

            <Button
              size="lg"
              onClick={() => login()}
              disabled={isLoggingIn}
              data-ocid="auth.login_button"
              className="h-12 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-cinema transition-all hover:scale-105"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Connecting…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Join Watch Party
                </>
              )}
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto w-full"
          >
            {[
              {
                icon: Play,
                label: "Synced Playback",
                desc: "Admin controls keep everyone in lock-step",
              },
              {
                icon: Users,
                label: "Group Viewing",
                desc: "Invite your friends to watch together",
              },
              {
                icon: MessageCircle,
                label: "Live Chat",
                desc: "React and discuss in real time",
              },
            ].map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                className="p-5 rounded-xl bg-card border border-border/50 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="font-display font-semibold text-sm text-foreground mb-1">
                  {label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="py-5 text-center border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
