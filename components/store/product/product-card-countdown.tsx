"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

interface Props {
  offerEnd: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Compact, ticking offer-end countdown built to fit inside product cards.
 * Renders time remaining as HH:MM:SS (or D:H:M:S when the offer lasts more
 * than a day). Returns null once the offer has elapsed so cards don't show a
 * stale / all-zero timer.
 */
export default function ProductCardCountdown({ offerEnd }: Props) {
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

  const urgent = hours < 1 && days < 1;

  return (
    <div className={`pcc-strip${urgent ? " pcc-strip--urgent" : ""}`} role="timer">
      <Flame size={13} className="pcc-strip-flame" />
      <span className="pcc-strip-label">Offer ends in</span>
      <span className="pcc-strip-time">{timeText}</span>
    </div>
  );
}
