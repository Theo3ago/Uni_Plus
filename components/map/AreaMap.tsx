"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/States";
import { googleUnavailable, onGoogleAuthFailure } from "@/lib/maps/google";
import type { MapData } from "./types";

const loading = () => <Skeleton className="h-full w-full rounded-none" />;
const GoogleAreaMap = dynamic(() => import("./GoogleAreaMap"), { ssr: false, loading });
const LeafletAreaMap = dynamic(() => import("./LeafletAreaMap"), { ssr: false, loading });

/** Google Maps when a working key is configured; otherwise (or on any failure) the key-less map. */
export function AreaMap({ data, label }: { data: MapData; label: string }) {
  const [useGoogle, setUseGoogle] = useState(() => !googleUnavailable());
  useEffect(() => onGoogleAuthFailure(() => setUseGoogle(false)), []);

  return (
    <div className="h-full w-full">
      {useGoogle ? (
        <GoogleAreaMap data={data} label={label} onFail={() => setUseGoogle(false)} />
      ) : (
        <LeafletAreaMap data={data} label={label} />
      )}
    </div>
  );
}
