"use client";

import { Compass, Heart, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/strings";

const TABS = [
  { href: "/decouvrir", label: t.tabs.discover, icon: Compass },
  { href: "/matchs", label: t.tabs.matches, icon: Heart },
  { href: "/messages", label: t.tabs.messages, icon: MessageCircle },
  { href: "/profil", label: t.tabs.profile, icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={t.tabs.label}
      className="no-print sticky bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur pb-safe"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? "text-navy" : "text-ink-2 hover:text-navy"
                }`}
              >
                <span
                  className={`absolute top-0 h-0.5 w-8 rounded-full transition-opacity ${
                    active ? "bg-orange opacity-100" : "opacity-0"
                  }`}
                  aria-hidden
                />
                <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
