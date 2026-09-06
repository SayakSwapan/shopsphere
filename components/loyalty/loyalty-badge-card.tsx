import { Award, Star, TrendingUp, Gift } from "lucide-react";

export interface LoyaltyBadgeDesign {
  badgeName: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  badgeIcon?: string | null;
  badgeImage?: string | null;
  badgeDescription?: string | null;
}

export interface LoyaltyProgressProps {
  purchaseCount: number;
  requiredPurchases: number;
  availableReward?: boolean;
  discountLabel?: string;
  design?: LoyaltyBadgeDesign | null;
}

/**
 * Full loyalty progress card with stars, badge and reward status.
 * Used on customer profile, dashboard, loyalty page and order details.
 */
export function LoyaltyProgressCard({
  purchaseCount,
  requiredPurchases,
  availableReward = false,
  discountLabel,
  design,
}: LoyaltyProgressProps) {
  const pct = requiredPurchases > 0
    ? Math.min(100, Math.round((purchaseCount / requiredPurchases) * 100))
    : 0;
  const remaining = Math.max(0, requiredPurchases - purchaseCount);
  const badge = design ?? {
    badgeName: "Loyal Customer",
    badgeBackgroundColor: "#F59E0B",
    badgeTextColor: "#FFFFFF",
    badgeBorderColor: "#D97706",
  };
  const iconColor = badge.badgeImage ? undefined : badge.badgeTextColor;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 border"
      style={{
        background: `linear-gradient(135deg, ${badge.badgeBackgroundColor}1f 0%, transparent 55%), radial-gradient(circle at 10% 20%, ${badge.badgeBackgroundColor}26, transparent 45%)`,
        borderColor: badge.badgeBorderColor + "66",
      }}
    >
      {/* Decorative sheen */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-2xl"
        style={{ background: badge.badgeBackgroundColor }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${badge.badgeBorderColor}, transparent)`,
        }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Badge — stylised medal/shield */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="relative">
            {/* glow ring */}
            <div
              className="absolute -inset-1.5 rounded-[1.4rem] opacity-40 blur-md"
              style={{ background: badge.badgeBackgroundColor }}
            />
            <div
              className="relative flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-[1.2rem] shadow-lg transition-transform hover:scale-105"
              style={{
                background: `linear-gradient(145deg, ${lighten(badge.badgeBackgroundColor, 18)} 0%, ${badge.badgeBackgroundColor} 45%, ${darken(badge.badgeBackgroundColor, 18)} 100%)`,
                color: iconColor,
                border: `2px solid ${badge.badgeBorderColor}`,
                boxShadow: `0 6px 18px ${badge.badgeBackgroundColor}55, inset 0 1px 0 ${badge.badgeTextColor}66`,
              }}
            >
              {badge.badgeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badge.badgeImage}
                  alt={badge.badgeName}
                  className="h-11 w-11 object-contain drop-shadow"
                />
              ) : badge.badgeIcon === "crown" ? (
                <Award size={30} strokeWidth={2.2} />
              ) : badge.badgeIcon === "star" ? (
                <Star size={30} strokeWidth={2.2} className="fill-current" />
              ) : badge.badgeIcon === "gift" ? (
                <Gift size={30} strokeWidth={2.2} />
              ) : badge.badgeIcon === "trending" ? (
                <TrendingUp size={30} strokeWidth={2.2} />
              ) : (
                <Award size={30} strokeWidth={2.2} />
              )}
            </div>
            {/* ribbon tab */}
            <span
              className="absolute -bottom-1 left-1/2 h-3 w-7 -translate-x-1/2 rounded-sm"
              style={{
                background: `linear-gradient(180deg, ${badge.badgeBackgroundColor}, ${darken(badge.badgeBackgroundColor, 20)})`,
                border: `1px solid ${badge.badgeBorderColor}`,
              }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-lg font-bold leading-tight"
              style={{ color: "var(--t-text-heading)" }}
            >
              {badge.badgeName}
            </h3>
            {availableReward && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold shadow"
                style={{
                  backgroundColor: badge.badgeBackgroundColor,
                  color: "#ffffff",
                  border: `1px solid ${badge.badgeBorderColor}`,
                }}
              >
                <Gift size={12} />
                Reward Unlocked
              </span>
            )}
          </div>
          {badge.badgeDescription && (
            <p className="mt-0.5 text-xs text-text-muted-2">
              {badge.badgeDescription}
            </p>
          )}
          <p className="mt-1 text-sm text-text-muted-1">
            {availableReward
              ? `🎉 You've earned a reward${discountLabel ? ` — ${discountLabel}` : ""}!`
              : `${remaining} more purchase${remaining === 1 ? "" : "s"} to unlock your reward${discountLabel ? ` (${discountLabel})` : ""}`}
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-text-muted-2">
              <span>
                {purchaseCount} / {requiredPurchases} purchases completed
              </span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-bg-card-nested">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundImage: `linear-gradient(90deg, ${badge.badgeBackgroundColor}, ${lighten(badge.badgeBackgroundColor, 15)})`,
                  boxShadow: `0 0 8px ${badge.badgeBackgroundColor}88`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Big number */}
        <div className="text-center shrink-0">
          <p className="text-3xl font-black leading-none" style={{ color: badge.badgeBackgroundColor }}>
            {purchaseCount}/{requiredPurchases}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-text-muted-2">
            Purchases
          </p>
          {availableReward && (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: badge.badgeBackgroundColor }}>
              Reward Ready
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexMix(hex: string, delta: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const v = parseInt(m[1], 16);
  const r = clamp255((v >> 16) + delta);
  const g = clamp255(((v >> 8) & 0xff) + delta);
  const b = clamp255((v & 0xff) + delta);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function lighten(hex: string, amount: number): string {
  return hexMix(hex, amount);
}

function darken(hex: string, amount: number): string {
  return hexMix(hex, -amount);
}

/**
 * Compact horizontal progress indicator with star icons.
 */
export function LoyaltyStars({
  purchaseCount,
  requiredPurchases,
  color = "#F59E0B",
}: {
  purchaseCount: number;
  requiredPurchases: number;
  color?: string;
}) {
  const stars = Array.from({ length: requiredPurchases }, (_, i) => i < purchaseCount);
  return (
    <div className="flex items-center gap-1.5">
      {stars.map((filled, i) => (
        <Star
          key={i}
          size={18}
          className={filled ? "fill-current" : "text-text-muted-3"}
          style={filled ? { color } : undefined}
        />
      ))}
    </div>
  );
}