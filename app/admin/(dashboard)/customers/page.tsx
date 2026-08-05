import { prisma } from "@/lib/prisma";
import CustomerTable from "@/components/admin/customers/customer-table";

export default async function CustomersPage() {
  let customers;
  try {
    customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
      },
      include: {
        addresses: {
          select: {
            id: true,
            city: true,
            state: true,
            pincode: true,
            isDefault: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold sm:text-3xl">Customers</h1>
          <p className="text-red-400">Failed to load customers. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-bold sm:text-3xl">
          Customers
        </h1>

        <p className="text-muted-foreground">
          Manage all customers
        </p>
      </div>

      <CustomerTable
        customers={customers}
      />

    </div>
  );
}