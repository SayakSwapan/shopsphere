import { prisma } from "./prisma";

export async function getDashboardAnalytics() {

  const orders =
    await prisma.order.findMany({
      select:{
        createdAt:true,
        totalAmount:true,
      }
    });

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
    );

    revenueData[
      month
    ].orders++;

  });

  return revenueData;

}