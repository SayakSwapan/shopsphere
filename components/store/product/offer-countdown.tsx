"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

interface Props {
  offerEnd: string;
  /** Use "panel" (product page) or "card" (product cards) sizing. */
  variant?: "panel" | "card";
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Compact, ticking offer-end countdown used on both the product page and the
 * product cards. Autosizes to fit its container, adapts to the active theme
 * via CSS variables, and wraps gracefully on small screens. Renders the
 * remaining time as HH:MM:SS (or D:H:M:S for offers spanning a day+) and
 * returns null once elapsed so no stale / all-zero timer is shown.
 */
export default function OfferCountdown({
  offerEnd,
  variant = "panel",
}: Props) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(offerEnd).getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const diff = new Date(offerEnd).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(id);
  }, [offerEnd, remaining]);

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

  const urgent = days < 1 && hours < 1;

  return (
    <div
      className={`cd-timer cd-timer--${variant}${urgent ? " cd-timer--urgent" : ""}`}
      role="timer"
    >
      <span className="cd-timer-inner">
        <Flame size={13} className="cd-timer-flame" aria-hidden />
        <span className="cd-timer-label">Offer ends in</span>
        <span className="cd-timer-value">{timeText}</span>
      </span>
    </div>
  );
}
