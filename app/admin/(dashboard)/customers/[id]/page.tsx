import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CustomerActions from "@/components/admin/customers/customer-actions";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerDetailsPage({
  params,
}: Props) {
  const { id } = await params;

  const customer =
    await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        addresses: {
          orderBy: {
            isDefault: "desc",
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        review: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        wishlist: {
          include: {
            wishlistitem: {
              include: {
                product: true,
              },
            },
          },
        },
        cart: {
          include: {
            cartitem: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Customer Details
          </h1>

          <p className="text-slate-400">
            {customer.email}
          </p>

        </div>

        <CustomerActions
          customerId={customer.id}
          isVerified={customer.isVerified}
          isActive={customer.isActive}
          phone={customer.phone}
        />

      </div>

      {/* CUSTOMER INFO */}

      <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">

        <h2 className="text-xl font-bold text-white mb-5">
          Basic Information
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          <Info
            title="Name"
            value={customer.name ?? "-"}
          />

          <Info
            title="Email"
            value={customer.email}
          />

          <Info
            title="Phone"
            value={customer.phone ?? "-"}
          />

          <Info
            title="Joined"
            value={customer.createdAt.toLocaleDateString()}
          />

          <Info
            title="Email Verified"
            value={
              customer.emailVerified
                ? "Yes"
                : "No"
            }
          />

          <Info
            title="Phone Verified"
            value={
              customer.phoneVerified
                ? "Yes"
                : "No"
            }
          />

          <Info
            title="Status"
            value={
              customer.isActive
                ? "Active"
                : "Inactive"
            }
          />

          <Info
            title="Verified"
            value={
              customer.isVerified
                ? "Verified"
                : "Pending"
            }
          />

        </div>

      </div>

      {/* ADDRESSES */}

      <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">

        <h2 className="text-xl font-bold text-white mb-6">
          Saved Addresses
        </h2>

        <div className="grid lg:grid-cols-2 gap-5">

          {customer.addresses.map((address) => (

            <div
              key={address.id}
              className="rounded-xl bg-slate-900 p-5 border border-slate-700"
            >

              <div className="flex justify-between">

                <h3 className="font-bold text-white">
                  {address.fullName}
                </h3>

                {address.isDefault && (
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                    Default
                  </span>
                )}

              </div>

              <div className="mt-3 text-slate-400 space-y-1">

                <p>{address.phone}</p>

                <p>{address.addressLine1}</p>

                {address.addressLine2 && (
                  <p>{address.addressLine2}</p>
                )}

                <p>
                  {address.city},{" "}
                  {address.state}
                </p>

                <p>{address.pincode}</p>

                <p>{address.country}</p>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* ORDERS */}

      <div className="rounded-2xl bg-[#111827] border border-slate-700 p-6">

        <h2 className="text-xl font-bold text-white mb-5">
          Recent Orders
        </h2>

        <div className="space-y-4">

          {customer.orders.map((order) => (

            <div
              key={order.id}
              className="rounded-xl bg-slate-900 p-4 flex justify-between"
            >

              <div>

                <p className="text-white font-semibold">
                  {order.orderNumber}
                </p>

                <p className="text-slate-400">
                  {order.status}
                </p>

              </div>

              <div className="text-right">

                <p className="font-bold text-amber-400">
                  ₹{Number(order.totalAmount)}
                </p>

                <p className="text-slate-500 text-sm">
                  {order.createdAt.toLocaleDateString()}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="text-white font-semibold mt-1">
        {value}
      </p>

    </div>
  );
}