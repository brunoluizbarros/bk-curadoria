"use client";

import { useEffect } from "react";
import { trackPixelEvent } from "@/lib/pixel";

interface TrackViewContentProps {
  id: string;
  name: string;
  priceCents: number;
}

export function TrackViewContent({ id, name, priceCents }: TrackViewContentProps) {
  useEffect(() => {
    trackPixelEvent("ViewContent", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      value: priceCents / 100,
      currency: "BRL",
    });
  }, [id, name, priceCents]);

  return null;
}
