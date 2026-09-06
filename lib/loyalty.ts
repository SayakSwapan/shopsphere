import { prisma } from "@/lib/prisma";
import type { Prisma, LoyaltyDiscountType, LoyaltyCycleStatus, LoyaltyPurchaseSource, LoyaltyRewardStatus } from "@prisma/client";

export type LoyaltyTx = Prisma.TransactionClient;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LoyaltyProgramConfig {
  id: string;
  isActive: boolean;
  requiredPurchases: number;
  discountType: LoyaltyDiscountType;
  discountValue: number;
  maxEligibleOrderAmount: number | null;
  maxDiscountAmount: number | null;
  minimumOrderAmount: number | null;
  rewardValidityDays: number | null;
  badgeName: string;
  badgeDescription: string | null;
  badgeIcon: string | null;
  badgeImage: string | null;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
}

export interface CustomerLoyaltyStatus {
  customerId: string;
  currentPurchaseCount: number;
  currentCycleNumber: number;
  requiredPurchases: number;
  availableReward: LoyaltyRewardStatus;
  rewardEarnedAt: Date | null;
  rewardExpiresAt: Date | null;
  totalRewardsEarned: number;
  totalRewardsRedeemed: number;
  totalDiscountReceived: number;
  hasAvailableReward: boolean;
  discountType: LoyaltyDiscountType;
  discountValue: number;
  badgeName: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  badgeIcon: string | null;
  badgeImage: string | null;
  badgeDescription: string | null;
}

export interface LoyaltyDiscountCalculation {
  applicable: boolean;
  discountAmount: number;
  eligibleAmount: number;
  reason?: string;
}

export interface LoyaltyCycleHistory {
  cycleNumber: number;
  requiredPurchases: number;
  completedPurchases: number;
  status: LoyaltyCycleStatus;
  discountType: LoyaltyDiscountType;
  discountValue: number;
  startedAt: Date;
  completedAt: Date | null;
  rewardEarnedAt: Date | null;
  rewardRedeemedAt: Date | null;
  totalDiscountUsed: number;
}

// ─── Program Settings ───────────────────────────────────────────────────────

const DEFAULT_PROGRAM_ID = "default";

/**
 * Get the current loyalty program configuration.
 * Creates a default one if none exists.
 */
export async function getLoyaltyProgram(): Promise<LoyaltyProgramConfig> {
  let program = await prisma.loyaltyProgram.findUnique({
    where: { id: DEFAULT_PROGRAM_ID },
  });

  if (!program) {
    program = await prisma.loyaltyProgram.create({
      data: { id: DEFAULT_PROGRAM_ID },
    });
  }

  return {
    id: program.id,
    isActive: program.isActive,
    requiredPurchases: program.requiredPurchases,
    discountType: program.discountType,
    discountValue: Number(program.discountValue),
    maxEligibleOrderAmount: program.maxEligibleOrderAmount ? Number(program.maxEligibleOrderAmount) : null,
    maxDiscountAmount: program.maxDiscountAmount ? Number(program.maxDiscountAmount) : null,
    minimumOrderAmount: program.minimumOrderAmount ? Number(program.minimumOrderAmount) : null,
    rewardValidityDays: program.rewardValidityDays,
    badgeName: program.badgeName,
    badgeDescription: program.badgeDescription,
    badgeIcon: program.badgeIcon,
    badgeImage: program.badgeImage,
    badgeBackgroundColor: program.badgeBackgroundColor,
    badgeTextColor: program.badgeTextColor,
    badgeBorderColor: program.badgeBorderColor,
  };
}

/**
 * Update the loyalty program configuration.
 */
export async function updateLoyaltyProgram(
  data: Partial<Omit<LoyaltyProgramConfig, "id">>
): Promise<LoyaltyProgramConfig> {
  await prisma.loyaltyProgram.upsert({
    where: { id: DEFAULT_PROGRAM_ID },
    create: { id: DEFAULT_PROGRAM_ID, ...data },
    update: data,
  });
  return getLoyaltyProgram();
}

// ─── Customer Loyalty Status ────────────────────────────────────────────────

/**
 * Get or create customer loyalty record.
 */
export async function getOrCreateCustomerLoyalty(customerId: string) {
  let loyalty = await prisma.customerLoyalty.findUnique({
    where: { customerId },
  });

  if (!loyalty) {
    loyalty = await prisma.customerLoyalty.create({
      data: { customerId },
    });
  }

  return loyalty;
}

/**
 * Get the full loyalty status for a customer (used in UI).
 */
export async function getCustomerLoyaltyStatus(
  customerId: string
): Promise<CustomerLoyaltyStatus | null> {
  const program = await getLoyaltyProgram();
  if (!program.isActive) return null;

  const loyalty = await getOrCreateCustomerLoyalty(customerId);

  // Check if reward has expired
  if (
    loyalty.availableReward === "AVAILABLE" &&
    loyalty.rewardExpiresAt &&
    loyalty.rewardExpiresAt < new Date()
  ) {
    await prisma.customerLoyalty.update({
      where: { customerId },
      data: { availableReward: "EXPIRED" },
    });
    loyalty.availableReward = "EXPIRED";
  }

  return {
    customerId,
    currentPurchaseCount: loyalty.currentPurchaseCount,
    currentCycleNumber: loyalty.currentCycleNumber,
    requiredPurchases: program.requiredPurchases,
    availableReward: loyalty.availableReward,
    rewardEarnedAt: loyalty.rewardEarnedAt,
    rewardExpiresAt: loyalty.rewardExpiresAt,
    totalRewardsEarned: loyalty.totalRewardsEarned,
    totalRewardsRedeemed: loyalty.totalRewardsRedeemed,
    totalDiscountReceived: Number(loyalty.totalDiscountReceived),
    hasAvailableReward:
      loyalty.availableReward === "AVAILABLE" &&
      (!loyalty.rewardExpiresAt || loyalty.rewardExpiresAt > new Date()),
    discountType: program.discountType,
    discountValue: program.discountValue,
    badgeName: program.badgeName,
    badgeBackgroundColor: program.badgeBackgroundColor,
    badgeTextColor: program.badgeTextColor,
    badgeBorderColor: program.badgeBorderColor,
    badgeIcon: program.badgeIcon,
    badgeImage: program.badgeImage,
    badgeDescription: program.badgeDescription,
  };
}

// ─── Purchase Counting ──────────────────────────────────────────────────────

/**
 * Count an eligible purchase toward a customer's loyalty progress.
 *
 * This is idempotent: calling it twice for the same orderId is safe.
 * Uses a database transaction for atomicity.
 *
 * Returns the updated loyalty status.
 */
export async function countEligiblePurchase(
  opts: {
    customerId: string;
    orderId: string;
    orderAmount: number;
    source: LoyaltyPurchaseSource;
  },
  client?: LoyaltyTx
): Promise<{ counted: boolean; rewardUnlocked: boolean }> {
  const { customerId, orderId, orderAmount, source } = opts;

  const program = await getLoyaltyProgram();
  if (!program.isActive) return { counted: false, rewardUnlocked: false };

  // Check minimum order amount
  if (
    program.minimumOrderAmount &&
    orderAmount < program.minimumOrderAmount
  ) {
    return { counted: false, rewardUnlocked: false };
  }

  // Idempotency: check if this order was already counted
  const existing = await prisma.loyaltyPurchase.findUnique({
    where: { orderId },
  });
  if (existing) return { counted: false, rewardUnlocked: false };

  const run = async (tx: LoyaltyTx) => {
    // Get or create loyalty record
    let loyalty = await tx.customerLoyalty.findUnique({
      where: { customerId },
    });
    if (!loyalty) {
      loyalty = await tx.customerLoyalty.create({
        data: { customerId },
      });
    }

    // Get or create current cycle
    let cycle = await tx.loyaltyCycle.findFirst({
      where: {
        customerId,
        cycleNumber: loyalty.currentCycleNumber,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!cycle) {
      cycle = await tx.loyaltyCycle.create({
        data: {
          customerId,
          customerLoyaltyId: loyalty.id,
          cycleNumber: loyalty.currentCycleNumber,
          requiredPurchasesSnapshot: program.requiredPurchases,
          discountTypeSnapshot: program.discountType,
          discountValueSnapshot: program.discountValue,
          maxEligibleOrderAmountSnapshot: program.maxEligibleOrderAmount,
          maxDiscountAmountSnapshot: program.maxDiscountAmount,
        },
      });
    }

    // If cycle already has a reward available or is redeemed, don't count
    if (cycle.status !== "IN_PROGRESS") {
      return { counted: false, rewardUnlocked: false };
    }

    // Record the purchase
    await tx.loyaltyPurchase.create({
      data: {
        customerId,
        loyaltyCycleId: cycle.id,
        orderId,
        source,
        purchaseAmount: orderAmount,
        isEligible: true,
      },
    });

    // Increment counts
    const newPurchaseCount = loyalty.currentPurchaseCount + 1;
    const newCyclePurchaseCount = cycle.completedPurchases + 1;

let rewardUnlocked = false;
    let newCycleStatus: LoyaltyCycleStatus = cycle.status;
    let rewardEarnedAt: Date | null = null;
    let rewardExpiresAt: Date | null = null;

    if (newCyclePurchaseCount >= program.requiredPurchases) {
      // Reward unlocked!
      rewardUnlocked = true;
      newCycleStatus = "REWARD_AVAILABLE";
      rewardEarnedAt = new Date();

      if (program.rewardValidityDays) {
        rewardExpiresAt = new Date();
        rewardExpiresAt.setDate(
          rewardExpiresAt.getDate() + program.rewardValidityDays
        );
      }
    }

    // Update cycle
    await tx.loyaltyCycle.update({
      where: { id: cycle.id },
      data: {
        completedPurchases: newCyclePurchaseCount,
        status: newCycleStatus,
        ...(rewardUnlocked ? { rewardEarnedAt } : {}),
      },
    });

    // Update customer loyalty
    await tx.customerLoyalty.update({
      where: { customerId },
      data: {
        currentPurchaseCount: newPurchaseCount,
        ...(rewardUnlocked
          ? {
              availableReward: "AVAILABLE" as LoyaltyRewardStatus,
              rewardEarnedAt,
              rewardExpiresAt,
              totalRewardsEarned: loyalty.totalRewardsEarned + 1,
            }
          : {}),
      },
    });

    return { counted: true, rewardUnlocked };
  };

  if (client) {
    return run(client);
  }

  const result = await prisma.$transaction(run);
  return result;
}

// ─── Reward Discount Calculation ────────────────────────────────────────────

/**
 * Calculate the loyalty reward discount for an order.
 *
 * This is pure calculation — it does NOT redeem or modify any state.
 * Run this BEFORE placing the order to show the discount in checkout.
 */
export async function calculateLoyaltyDiscount(
  customerId: string,
  orderAmount: number
): Promise<LoyaltyDiscountCalculation> {
  const program = await getLoyaltyProgram();
  if (!program.isActive) {
    return { applicable: false, discountAmount: 0, eligibleAmount: 0, reason: "Loyalty program is inactive" };
  }

  const loyalty = await prisma.customerLoyalty.findUnique({
    where: { customerId },
  });

  if (!loyalty || loyalty.availableReward !== "AVAILABLE") {
    return { applicable: false, discountAmount: 0, eligibleAmount: 0, reason: "No reward available" };
  }

  // Check expiry
  if (loyalty.rewardExpiresAt && loyalty.rewardExpiresAt < new Date()) {
    return { applicable: false, discountAmount: 0, eligibleAmount: 0, reason: "Reward has expired" };
  }

  // Check minimum order amount
  if (program.minimumOrderAmount && orderAmount < Number(program.minimumOrderAmount)) {
    return {
      applicable: false,
      discountAmount: 0,
      eligibleAmount: 0,
      reason: `Minimum order amount of ₹${Number(program.minimumOrderAmount).toFixed(2)} required`,
    };
  }

  // Calculate eligible amount (capped at maxEligibleOrderAmount)
  const eligibleAmount = program.maxEligibleOrderAmount
    ? Math.min(orderAmount, Number(program.maxEligibleOrderAmount))
    : orderAmount;

  let discountAmount: number;
  if (program.discountType === "PERCENTAGE") {
    discountAmount = (eligibleAmount * Number(program.discountValue)) / 100;
  } else {
    discountAmount = Number(program.discountValue);
  }

  // Cap at maxDiscountAmount
  if (program.maxDiscountAmount && discountAmount > Number(program.maxDiscountAmount)) {
    discountAmount = Number(program.maxDiscountAmount);
  }

  // Never exceed order amount
  discountAmount = Math.min(discountAmount, orderAmount);

  return {
    applicable: true,
    discountAmount: Math.round(discountAmount * 100) / 100,
    eligibleAmount,
  };
}

// ─── Reward Redemption ──────────────────────────────────────────────────────

/**
 * Redeem a loyalty reward when an order is placed.
 *
 * Must be called inside a database transaction that also creates the order.
 * Deducts the discount from the order total and resets the loyalty cycle.
 *
 * Returns the discount amount applied.
 */
export async function redeemLoyaltyReward(
  tx: LoyaltyTx,
  opts: {
    customerId: string;
    orderId: string;
    orderAmount: number;
    source: LoyaltyPurchaseSource;
  }
): Promise<{ discountAmount: number; cycleId: string } | null> {
  const { customerId, orderId, orderAmount, source } = opts;

  const program = await getLoyaltyProgram();
  if (!program.isActive) return null;

  const loyalty = await tx.customerLoyalty.findUnique({
    where: { customerId },
  });

  if (!loyalty || loyalty.availableReward !== "AVAILABLE") return null;

  // Check expiry
  if (loyalty.rewardExpiresAt && loyalty.rewardExpiresAt < new Date()) return null;

  // Check minimum order amount
  if (program.minimumOrderAmount && orderAmount < Number(program.minimumOrderAmount)) return null;

  // Calculate discount
  const eligibleAmount = program.maxEligibleOrderAmount
    ? Math.min(orderAmount, Number(program.maxEligibleOrderAmount))
    : orderAmount;

  let discountAmount: number;
  if (program.discountType === "PERCENTAGE") {
    discountAmount = (eligibleAmount * Number(program.discountValue)) / 100;
  } else {
    discountAmount = Number(program.discountValue);
  }

  if (program.maxDiscountAmount && discountAmount > Number(program.maxDiscountAmount)) {
    discountAmount = Number(program.maxDiscountAmount);
  }
  discountAmount = Math.min(discountAmount, orderAmount);
  discountAmount = Math.round(discountAmount * 100) / 100;

  // Find the current cycle
  const currentCycle = await tx.loyaltyCycle.findFirst({
    where: {
      customerId,
      cycleNumber: loyalty.currentCycleNumber,
      status: "REWARD_AVAILABLE",
    },
  });

  if (!currentCycle) return null;

  // Record redemption
  await tx.loyaltyRewardRedemption.create({
    data: {
      customerId,
      loyaltyCycleId: currentCycle.id,
      orderId,
      source,
      discountAmount,
      orderAmount,
    },
  });

  // Update cycle status
  await tx.loyaltyCycle.update({
    where: { id: currentCycle.id },
    data: {
      status: "REDEEMED",
      rewardRedeemedAt: new Date(),
      totalDiscountUsed: discountAmount,
    },
  });

  // Reset customer loyalty for next cycle
  const nextCycleNumber = loyalty.currentCycleNumber + 1;

  // Create next cycle
  const nextCycle = await tx.loyaltyCycle.create({
    data: {
      customerId,
      customerLoyaltyId: loyalty.id,
      cycleNumber: nextCycleNumber,
      requiredPurchasesSnapshot: program.requiredPurchases,
      discountTypeSnapshot: program.discountType,
      discountValueSnapshot: program.discountValue,
      maxEligibleOrderAmountSnapshot: program.maxEligibleOrderAmount,
      maxDiscountAmountSnapshot: program.maxDiscountAmount,
    },
  });

  // Update customer loyalty
  await tx.customerLoyalty.update({
    where: { customerId },
    data: {
      currentPurchaseCount: 0,
      currentCycleNumber: nextCycleNumber,
      availableReward: "PENDING",
      rewardEarnedAt: null,
      rewardExpiresAt: null,
      totalRewardsRedeemed: loyalty.totalRewardsRedeemed + 1,
      totalDiscountReceived: Number(loyalty.totalDiscountReceived) + discountAmount,
    },
  });

  return { discountAmount, cycleId: nextCycle.id };
}

// ─── Refund / Cancellation Handling ─────────────────────────────────────────

/**
 * Handle loyalty adjustment when an order is refunded/cancelled.
 *
 * If the purchase was counted but reward not yet redeemed:
 *   - Remove the purchase count
 *   - Decrement cycle progress
 *
 * If the reward was already redeemed on this order:
 *   - Create an admin notification for manual review
 *   - Do NOT silently modify history
 */
export async function handleRefundLoyaltyAdjustment(opts: {
  customerId: string;
  orderId: string;
}): Promise<{ adjusted: boolean; message: string }> {
  const { customerId, orderId } = opts;

  const purchase = await prisma.loyaltyPurchase.findUnique({
    where: { orderId },
    include: { loyaltyCycle: true },
  });

  if (!purchase) {
    return { adjusted: false, message: "No loyalty purchase found for this order" };
  }

  // Check if a reward was redeemed on this order
  const redemption = await prisma.loyaltyRewardRedemption.findUnique({
    where: { orderId },
  });

  if (redemption) {
    // Reward was already used — needs manual review
    return {
      adjusted: false,
      message: "A loyalty reward was redeemed on this order. Manual admin review required.",
    };
  }

  // Remove the purchase and decrement counts
  await prisma.$transaction(async (tx) => {
    await tx.loyaltyPurchase.delete({ where: { orderId } });

    const loyalty = await tx.customerLoyalty.findUnique({
      where: { customerId },
    });
    if (!loyalty) return;

    const cycle = purchase.loyaltyCycle;
    const newCycleCount = Math.max(0, cycle.completedPurchases - 1);
    const newTotalCount = Math.max(0, loyalty.currentPurchaseCount - 1);

    await tx.loyaltyCycle.update({
      where: { id: cycle.id },
      data: { completedPurchases: newCycleCount },
    });

    await tx.customerLoyalty.update({
      where: { customerId },
      data: { currentPurchaseCount: newTotalCount },
    });
  });

  return { adjusted: true, message: "Loyalty purchase removed and progress adjusted" };
}

// ─── Admin Manual Adjustments ───────────────────────────────────────────────

/**
 * Admin manually adjusts a customer's loyalty progress.
 */
export async function adminAdjustLoyaltyProgress(opts: {
  customerId: string;
  adminId: string;
  newPurchaseCount: number;
  reason: string;
}): Promise<void> {
  const { customerId, adminId, newPurchaseCount, reason } = opts;

  const loyalty = await getOrCreateCustomerLoyalty(customerId);
  const previousCount = loyalty.currentPurchaseCount;

  await prisma.$transaction(async (tx) => {
    // Update the count
    await tx.customerLoyalty.update({
      where: { customerId },
      data: { currentPurchaseCount: newPurchaseCount },
    });

    // Update cycle
    const cycle = await tx.loyaltyCycle.findFirst({
      where: {
        customerId,
        cycleNumber: loyalty.currentCycleNumber,
      },
    });
    if (cycle) {
      await tx.loyaltyCycle.update({
        where: { id: cycle.id },
        data: { completedPurchases: newPurchaseCount },
      });
    }

    // Audit log
    await tx.loyaltyAuditLog.create({
      data: {
        customerId,
        adminId,
        action: "ADJUST_PROGRESS",
        previousValue: String(previousCount),
        newValue: String(newPurchaseCount),
        reason,
      },
    });
  });
}

/**
 * Admin manually grants a reward to a customer.
 */
export async function adminGrantReward(opts: {
  customerId: string;
  adminId: string;
  reason: string;
}): Promise<void> {
  const { customerId, adminId, reason } = opts;

  const loyalty = await getOrCreateCustomerLoyalty(customerId);
  const program = await getLoyaltyProgram();

  await prisma.$transaction(async (tx) => {
    const now = new Date();
    let rewardExpiresAt: Date | null = null;
    if (program.rewardValidityDays) {
      rewardExpiresAt = new Date();
      rewardExpiresAt.setDate(rewardExpiresAt.getDate() + program.rewardValidityDays);
    }

    await tx.customerLoyalty.update({
      where: { customerId },
      data: {
        availableReward: "AVAILABLE",
        rewardEarnedAt: now,
        rewardExpiresAt,
        totalRewardsEarned: loyalty.totalRewardsEarned + 1,
      },
    });

    // Update cycle status
    const cycle = await tx.loyaltyCycle.findFirst({
      where: {
        customerId,
        cycleNumber: loyalty.currentCycleNumber,
      },
    });
    if (cycle) {
      await tx.loyaltyCycle.update({
        where: { id: cycle.id },
        data: {
          status: "REWARD_AVAILABLE",
          rewardEarnedAt: now,
        },
      });
    }

    await tx.loyaltyAuditLog.create({
      data: {
        customerId,
        adminId,
        action: "GRANT_REWARD",
        previousValue: loyalty.availableReward,
        newValue: "AVAILABLE",
        reason,
      },
    });
  });
}

/**
 * Admin manually revokes a reward from a customer.
 */
export async function adminRevokeReward(opts: {
  customerId: string;
  adminId: string;
  reason: string;
}): Promise<void> {
  const { customerId, adminId, reason } = opts;

  const loyalty = await getOrCreateCustomerLoyalty(customerId);

  await prisma.$transaction(async (tx) => {
    await tx.customerLoyalty.update({
      where: { customerId },
      data: {
        availableReward: "REVOKED",
        rewardEarnedAt: null,
        rewardExpiresAt: null,
      },
    });

    const cycle = await tx.loyaltyCycle.findFirst({
      where: {
        customerId,
        cycleNumber: loyalty.currentCycleNumber,
      },
    });
    if (cycle && cycle.status === "REWARD_AVAILABLE") {
      await tx.loyaltyCycle.update({
        where: { id: cycle.id },
        data: { status: "CANCELLED" },
      });
    }

    await tx.loyaltyAuditLog.create({
      data: {
        customerId,
        adminId,
        action: "REVOKE_REWARD",
        previousValue: loyalty.availableReward,
        newValue: "REVOKED",
        reason,
      },
    });
  });
}

// ─── Dashboard Analytics ────────────────────────────────────────────────────

export async function getLoyaltyDashboard() {
  const program = await getLoyaltyProgram();

  const [
    totalParticipating,
    activeCustomers,
    totalRewardsEarned,
    totalRewardsRedeemed,
    totalDiscountGiven,
    onlineRewardsUsed,
    offlineRewardsUsed,
  ] = await Promise.all([
    prisma.customerLoyalty.count(),
    prisma.customerLoyalty.count({
      where: { currentPurchaseCount: { gt: 0 } },
    }),
    prisma.customerLoyalty.aggregate({
      _sum: { totalRewardsEarned: true },
    }),
    prisma.customerLoyalty.aggregate({
      _sum: { totalRewardsRedeemed: true },
    }),
    prisma.customerLoyalty.aggregate({
      _sum: { totalDiscountReceived: true },
    }),
    prisma.loyaltyRewardRedemption.count({
      where: { source: "ONLINE" },
    }),
    prisma.loyaltyRewardRedemption.count({
      where: { source: "OFFLINE" },
    }),
  ]);

  const recentRedemptions = await prisma.loyaltyRewardRedemption.findMany({
    take: 10,
    orderBy: { redeemedAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const topCustomers = await prisma.customerLoyalty.findMany({
    take: 10,
    orderBy: { totalDiscountReceived: "desc" },
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return {
    program,
    stats: {
      totalParticipating,
      activeCustomers,
      totalRewardsEarned: totalRewardsEarned._sum.totalRewardsEarned ?? 0,
      totalRewardsRedeemed: totalRewardsRedeemed._sum.totalRewardsRedeemed ?? 0,
      totalDiscountGiven: Number(totalDiscountGiven._sum.totalDiscountReceived ?? 0),
      onlineRewardsUsed,
      offlineRewardsUsed,
    },
    recentRedemptions: recentRedemptions.map((r) => ({
      id: r.id,
      customerName: r.customer.name ?? "Unknown",
      customerEmail: r.customer.email,
      discountAmount: Number(r.discountAmount),
      orderAmount: Number(r.orderAmount),
      source: r.source,
      redeemedAt: r.redeemedAt,
    })),
    topCustomers: topCustomers.map((c) => ({
      id: c.customer.id,
      name: c.customer.name ?? "Unknown",
      email: c.customer.email,
      totalRewardsEarned: c.totalRewardsEarned,
      totalRewardsRedeemed: c.totalRewardsRedeemed,
      totalDiscountReceived: Number(c.totalDiscountReceived),
    })),
  };
}

// ─── Customer History ───────────────────────────────────────────────────────

export async function getCustomerLoyaltyHistory(customerId: string) {
  const loyalty = await prisma.customerLoyalty.findUnique({
    where: { customerId },
  });

  if (!loyalty) return { cycles: [], current: null };

  const cycles = await prisma.loyaltyCycle.findMany({
    where: { customerId },
    orderBy: { cycleNumber: "desc" },
    include: {
      purchases: {
        orderBy: { countedAt: "asc" },
      },
      redemptions: true,
    },
  });

  const program = await getLoyaltyProgram();

  return {
    current: {
      purchaseCount: loyalty.currentPurchaseCount,
      cycleNumber: loyalty.currentCycleNumber,
      availableReward: loyalty.availableReward,
      rewardEarnedAt: loyalty.rewardEarnedAt,
      rewardExpiresAt: loyalty.rewardExpiresAt,
      totalRewardsEarned: loyalty.totalRewardsEarned,
      totalRewardsRedeemed: loyalty.totalRewardsRedeemed,
      totalDiscountReceived: Number(loyalty.totalDiscountReceived),
      badgeName: program.badgeName,
      badgeBackgroundColor: program.badgeBackgroundColor,
      badgeTextColor: program.badgeTextColor,
      badgeBorderColor: program.badgeBorderColor,
      badgeIcon: program.badgeIcon,
    },
    cycles: cycles.map((c) => ({
      cycleNumber: c.cycleNumber,
      requiredPurchases: c.requiredPurchasesSnapshot,
      completedPurchases: c.completedPurchases,
      status: c.status,
      discountType: c.discountTypeSnapshot,
      discountValue: Number(c.discountValueSnapshot),
      startedAt: c.startedAt,
      completedAt: c.completedAt,
      rewardEarnedAt: c.rewardEarnedAt,
      rewardRedeemedAt: c.rewardRedeemedAt,
      totalDiscountUsed: Number(c.totalDiscountUsed),
      purchaseCount: c.purchases.length,
      sourceBreakdown: {
        online: c.purchases.filter((p) => p.source === "ONLINE").length,
        offline: c.purchases.filter((p) => p.source === "OFFLINE").length,
      },
    })),
  };
}

// ─── Eligible Order Statuses ────────────────────────────────────────────────

/**
 * Orders with these statuses count toward loyalty progress.
 */
export const LOYALTY_ELIGIBLE_STATUSES = [
  "CONFIRMED",
  "PAID",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

/**
 * Check if an order status is eligible for loyalty counting.
 */
export function isOrderEligibleForLoyalty(status: string): boolean {
  return (LOYALTY_ELIGIBLE_STATUSES as readonly string[]).includes(status);
}

/**
 * Orders with these statuses should have their loyalty purchase reversed.
 */
export const LOYALTY_REVERSAL_STATUSES = ["CANCELLED"] as const;
