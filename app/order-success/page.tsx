import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import OrderSuccessView from "@/components/store/order-success/order-success-view";

interface Props {
  searchParams: Promise<{
    id?: string;
  }>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export default async function OrderSuccessPage({
  searchParams,
}: Props) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.id) {
    const redirectTo = `/order-success${params.id ? `?id=${params.id}` : ""}`;
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (!params.id) {
    redirect("/");
  }

  const order = await prisma.order.findUnique({
    where: {
      id: params.id,
      userId: session.user.id as string,
    },
    include: {
      orderitem: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              productimage: {
                select: { url: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    redirect("/");
  }

  const items = order.orderitem.map((item) => {
    const variant = [
      item.variantGender,
      item.variantSize && `Size: ${item.variantSize}`,
      item.variantSku,
    ]
      .filter(Boolean)
      .join(" · ");

    const gstPerUnit = item.gstSnapshot != null ? Number(item.gstSnapshot) : 0;
    const unitIncl = round2(Number(item.price) + gstPerUnit);
    const lineIncl = round2(unitIncl * item.quantity);

    return {
      id: item.id,
      name: item.product.name,
      slug: item.product.slug,
      imageUrl: item.product.productimage?.[0]?.url ?? null,
      quantity: item.quantity,
      price: unitIncl,
      total: lineIncl,
      variant,
    };
  });

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const itemSubtotalIncl = round2(items.reduce((sum, i) => sum + i.total, 0));

  const gstTotal = order.gst != null ? Number(order.gst) : 0;
  const subtotalExcl =
    order.subtotal != null ? Number(order.subtotal) : round2(itemSubtotalIncl - gstTotal);

  const subtotalIncl = round2(subtotalExcl + gstTotal);

  const placedAt = order.createdAt;
  const deliveryFrom = new Date(placedAt.getTime() + 4 * 24 * 60 * 60 * 1000);
  const deliveryTo = new Date(placedAt.getTime() + 9 * 24 * 60 * 60 * 1000);

  const viewOrder = {
    orderNumber: order.orderNumber,
    createdAt: placedAt.toISOString(),
    totalAmount: Number(order.totalAmount),
    subtotal: subtotalIncl,
    shipping: order.shipping != null ? Number(order.shipping) : 0,
    discount: order.discount != null ? Number(order.discount) : 0,
    transactionFee:
      order.transactionFee != null ? Number(order.transactionFee) : 0,
    totalItems,
    items,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    fullName: order.fullName,
    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    country: order.country,
    phone: order.phone,
    deliveryFrom: deliveryFrom.toISOString(),
    deliveryTo: deliveryTo.toISOString(),
  };

  return (
    <div className="min-h-screen bg-bg-page">

      <NavbarWrapper />

      <OrderSuccessView order={viewOrder} />

      <Footer />

    </div>
  );
}
