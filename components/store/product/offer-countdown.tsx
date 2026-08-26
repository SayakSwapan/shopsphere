"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

interface Props {
  offerEnd: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function OfferCountdown({ offerEnd }: Props) {
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

  const blocks = [
    { value: pad(days), label: "Days" },
    { value: pad(hours), label: "Hrs" },
    { value: pad(minutes), label: "Min" },
    { value: pad(seconds), label: "Sec" },
  ];

  return (
    <div className="pd-timer-wrapper">
      <div className="pd-timer-header">
        <Flame size={14} className="pd-timer-flame" />
        <span className="pd-timer-headline">Hurry! Offer ends in</span>
      </div>

      <div className="pd-timer-row">
        {blocks.map((b, i) => (
          <div key={b.label} className="pd-timer-segment">
            <div className="pd-timer-box">
              <span className="pd-timer-value">{b.value}</span>
            </div>
            <span className="pd-timer-label">{b.label}</span>
            {i < blocks.length - 1 && (
              <span className="pd-timer-sep">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
