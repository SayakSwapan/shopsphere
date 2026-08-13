import { prisma } from "./prisma";
import { getCompletedRefundMap } from "./finance/refund.service";

export async function getDashboardAnalytics() {

  const orders =
    await prisma.order.findMany({
      where: {
        status: { notIn: ["CANCELLED"] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        id: true,
      },
    });

  const refundMap = await getCompletedRefundMap(orders.map((o) => o.id));

  const revenueData=[
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].map(month=>({

    month,

    revenue:0,

    orders:0,

  }));

  orders.forEach(order=>{

    const month=
      order.createdAt.getMonth();

    revenueData[
      month
    ].revenue+=Number(
      order.totalAmount
    ) - (refundMap.get(order.id) ?? 0);

    revenueData[
      month
    ].orders++;

  });

  return revenueData;

}