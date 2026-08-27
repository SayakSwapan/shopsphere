"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";

interface Props {
  /** The target date-time (ISO string) to count down toward. */
  offerEnd: string;
  /** "ends" (default) counts down to the offer ending; "starts" to it beginning. */
  mode?: "ends" | "starts";
  /** Use "panel" (product page) or "card" (product cards) sizing. */
  variant?: "panel" | "card";
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Compact, ticking countdown used on both the product page and the product
 * cards. Autosizes to fit its container, adapts to the active theme via CSS
 * variables, and wraps gracefully on small screens. Renders the remaining time
 * as HH:MM:SS (or D:H:M:S for windows spanning a day+) and returns null once
 * elapsed so no stale / all-zero timer is shown.
 *
 * In "starts" mode it counts down to an offer that hasn't begun yet so the
 * customer knows a discount is coming (e.g. "Offer starts in 03:12:44").
 */
export default function OfferCountdown({
  offerEnd,
  mode = "ends",
  variant = "panel",
}: Props) {
  const target = useMemo(() => new Date(offerEnd).getTime(), [offerEnd]);
  const [remaining, setRemaining] = useState(() => {
    const diff = target - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const diff = target - Date.now();
      setRemaining(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(id);
  }, [target, remaining]);

  if (remaining <= 0) return null;

  const totalSec = Math.floor(remaining / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const timeText =
    days > 0
      ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const urgent = mode === "ends" && days < 1 && hours < 1;
  const isStarts = mode === "starts";

  return (
    <div
      className={`cd-timer cd-timer--${variant}${urgent ? " cd-timer--urgent" : ""}${
        isStarts ? " cd-timer--starts" : ""
      }`}
      role="timer"
    >
      <span className="cd-timer-inner">
        <Flame size={13} className="cd-timer-flame" aria-hidden />
        <span className="cd-timer-label">
          {isStarts ? "Offer starts in" : "Offer ends in"}
        </span>
        <span className="cd-timer-value">{timeText}</span>
      </span>
    </div>
  );
}
