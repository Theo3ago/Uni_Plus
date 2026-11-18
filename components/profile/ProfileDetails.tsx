import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  BookOpen,
  CalendarDays,
  Cigarette,
  GraduationCap,
  Headphones,
  MapPin,
  PawPrint,
  Sparkles,
  Sunrise,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { Tag } from "@/components/ui/Chip";
import { formatBudget, formatDate, formatTime } from "@/lib/format";
import { SCHOOLS } from "@/lib/schools";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

const F = t.profile.fields;
const L = t.labels;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] bg-card p-5 shadow-soft">
      <h3 className="mb-3 text-lg text-navy">{title}</h3>
      {children}
    </section>
  );
}

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-navy" strokeWidth={1.75} aria-hidden />
      <div className="min-w-0">
        <dt className="text-[13px] text-ink-2">{label}</dt>
        <dd className="text-[15px] font-medium text-navy">{value}</dd>
      </div>
    </div>
  );
}

/** Full profile sections: bio, interests, study habits, lifestyle, housing. */
export function ProfileDetails({ profile }: { profile: Profile }) {
  const { study, lifestyle } = profile;
  return (
    <div className="space-y-4">
      <Section title={t.profile.sections.about}>
        <p className="text-[15px] leading-relaxed text-ink-2">{profile.bio || t.profile.noBio}</p>
        <dl className="mt-2 divide-y divide-line">
          <Row icon={MapPin} label={F.school} value={SCHOOLS[profile.school].name} />
          <Row icon={GraduationCap} label={F.program} value={`${profile.program} · ${L.year[profile.year]}`} />
        </dl>
      </Section>

      {profile.interests.length ? (
        <Section title={t.profile.sections.interests}>
          <ul className="flex flex-wrap gap-2">
            {profile.interests.map((x) => (
              <li key={x}>
                <Tag>{x}</Tag>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title={t.profile.sections.study}>
        <dl className="grid grid-cols-2 gap-x-3">
          <Row icon={Headphones} label={F.noise} value={L.noise[study.noise]} />
          <Row icon={BookOpen} label={F.place} value={L.place[study.place]} />
          <Row icon={Sunrise} label={F.chronotype} value={L.chronotype[study.chronotype]} />
          <Row icon={GraduationCap} label={F.examMode} value={L.examMode[study.examMode]} />
        </dl>
      </Section>

      <Section title={t.profile.sections.lifestyle}>
        <dl className="grid grid-cols-2 gap-x-3">
          <Row icon={BedDouble} label={F.bedtime} value={formatTime(lifestyle.bedtime)} />
          <Row
            icon={Sparkles}
            label={F.cleanliness}
            value={`${lifestyle.cleanliness}/5 · ${L.cleanliness[lifestyle.cleanliness]}`}
          />
          <Row icon={Users} label={F.guests} value={L.guests[lifestyle.guests]} />
          <Row icon={Cigarette} label={F.smoking} value={L.smoking[lifestyle.smoking]} />
          <Row icon={PawPrint} label={F.pets} value={L.pets[lifestyle.pets]} />
        </dl>
      </Section>

      <Section title={t.profile.sections.housing}>
        <dl className="grid grid-cols-2 gap-x-3">
          <Row icon={Wallet} label={F.budget} value={formatBudget(profile.budget.min, profile.budget.max)} />
          <Row icon={CalendarDays} label={F.moveIn} value={formatDate(profile.moveIn)} />
        </dl>
      </Section>
    </div>
  );
}
