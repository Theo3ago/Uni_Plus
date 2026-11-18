"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FieldGroup, RangeSlider, Segmented } from "@/components/ui/Form";
import { Sheet } from "@/components/ui/Sheet";
import { BUDGET_RANGE } from "@/lib/config";
import { DEFAULT_FILTERS, type Filters } from "@/lib/data/swipes";
import { formatMoney } from "@/lib/format";
import { SCHOOL_IDS, SCHOOLS } from "@/lib/schools";
import { t } from "@/lib/strings";

const f = t.filters;

export function FiltersSheet({
  open,
  value,
  onApply,
  onClose,
}: {
  open: boolean;
  value: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={f.title}>
      {/* Remount on open so the draft starts from the applied filters. */}
      {open ? <FiltersForm initial={value} onApply={onApply} /> : null}
    </Sheet>
  );
}

function FiltersForm({ initial, onApply }: { initial: Filters; onApply: (f: Filters) => void }) {
  const [draft, setDraft] = useState<Filters>(initial);
  const toggleSchool = (id: (typeof SCHOOL_IDS)[number]) =>
    setDraft((d) => ({
      ...d,
      schools: d.schools.includes(id) ? d.schools.filter((s) => s !== id) : [...d.schools, id],
    }));

  return (
    <div className="space-y-7 px-5 pb-6 pt-5">
      <FieldGroup label={f.schools}>
        <div className="flex flex-wrap gap-2">
          <Chip selected={draft.schools.length === 0} onClick={() => setDraft((d) => ({ ...d, schools: [] }))}>
            {f.allSchools}
          </Chip>
          {SCHOOL_IDS.map((id) => (
            <Chip key={id} selected={draft.schools.includes(id)} onClick={() => toggleSchool(id)}>
              {SCHOOLS[id].short}
            </Chip>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label={f.budget} hint={f.budgetHint}>
        <p className="mb-1 font-display text-xl font-bold text-navy" aria-live="polite">
          {formatMoney(draft.budget[0])} – {formatMoney(draft.budget[1])}
        </p>
        <RangeSlider
          min={BUDGET_RANGE.min}
          max={BUDGET_RANGE.max}
          step={BUDGET_RANGE.step}
          value={draft.budget}
          onChange={(budget) => setDraft((d) => ({ ...d, budget }))}
          labels={[t.onboarding.budget.min, t.onboarding.budget.max]}
          format={formatMoney}
        />
      </FieldGroup>

      <Segmented<Filters["moveInWithinMonths"]>
        label={f.moveIn}
        value={draft.moveInWithinMonths}
        onChange={(moveInWithinMonths) => setDraft((d) => ({ ...d, moveInWithinMonths }))}
        options={[
          { value: 0, label: f.moveInAny },
          { value: 1, label: f.moveInWithin(1) },
          { value: 3, label: f.moveInWithin(3) },
          { value: 6, label: f.moveInWithin(6) },
        ]}
      />

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={() => setDraft(DEFAULT_FILTERS)}>
          {f.reset}
        </Button>
        <Button className="flex-[2]" onClick={() => onApply(draft)}>
          {f.apply}
        </Button>
      </div>
    </div>
  );
}
