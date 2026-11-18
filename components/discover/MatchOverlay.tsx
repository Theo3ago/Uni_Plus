"use client";

/* eslint-disable @next/next/no-img-element -- data: URLs */
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import type { Match } from "@/lib/data/swipes";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

function Avatar({ profile, className }: { profile: Profile; className: string }) {
  return (
    <div className={`h-32 w-32 overflow-hidden rounded-full border-4 border-card bg-navy-50 shadow-lift ${className}`}>
      {profile.photos[0] ? (
        <img src={profile.photos[0]} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center font-display text-4xl font-bold text-navy">
          {profile.firstName[0]}
        </span>
      )}
    </div>
  );
}

/** « C'est un match ! » screen. */
export function MatchOverlay({ match, me, onClose }: { match: Match | null; me: Profile; onClose: () => void }) {
  return (
    <Sheet open={Boolean(match)} onClose={onClose} title={t.match.title} hideTitle variant="full">
      {match ? (
        <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
          <div className="relative flex items-center">
            <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <Avatar profile={me} className="-rotate-6" />
            </motion.div>
            <motion.div
              className="z-10 -mx-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange font-display text-3xl font-bold text-navy shadow-lift"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 15 }}
              aria-hidden
            >
              +
            </motion.div>
            <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <Avatar profile={match.profile} className="rotate-6" />
            </motion.div>
          </div>

          <motion.p
            className="mt-10 font-display text-[40px] font-bold leading-none text-navy"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            aria-hidden
          >
            {t.match.title}
          </motion.p>
          <p className="mt-3 max-w-[28ch] text-[16px] leading-relaxed text-ink-2">
            {t.match.body(match.profile.firstName)}
          </p>

          <div className="mt-10 flex w-full flex-col gap-3">
            {/* Chat arrives in step 4: this will become /messages/${match.id}. */}
            <ButtonLink href="/matchs" className="h-14 w-full text-base">
              <MessageCircle className="h-5 w-5" aria-hidden />
              {t.match.message}
            </ButtonLink>
            <Button variant="ghost" className="h-12 w-full" onClick={onClose}>
              {t.match.keepGoing}
            </Button>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
