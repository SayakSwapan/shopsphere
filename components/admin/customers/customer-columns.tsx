import Link from "next/link";
import {
  Eye,
  MapPin,
} from "lucide-react";

export const customerHeaders = [
  "Customer",
  "Contact",
  "Addresses",
  "Verification",
  "Status",
  "Joined",
  "Action",
];

interface Address {
  id: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface Props {
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    isVerified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    addresses: Address[];
  };
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  );
}

export function CustomerRow({
  customer,
}: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-900/40 transition">

      <td className="px-5 py-5">

        <div className="font-semibold text-white">
          {customer.name ?? "No Name"}
        </div>

        <div className="text-xs text-slate-500 mt-1">
          ID :
          {" "}
          {customer.id.slice(0, 8)}
        </div>

      </td>

      <td className="px-5 py-5">

        <div className="text-slate-200">
          {customer.email}
        </div>

        <div className="text-sm text-slate-500 mt-1">
          {customer.phone ?? "--"}
        </div>

      </td>

      <td className="px-5 py-5">

        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">

          <MapPin
            size={15}
            className="text-amber-400"
          />

          <span className="text-white font-medium">

            {
              customer.addresses.length
            }

          </span>

        </div>

      </td>

      <td className="px-5 py-5">

        {customer.isVerified ? (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
            Verified
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
            Pending
          </span>
        )}

      </td>

      <td className="px-5 py-5">

        {customer.isActive ? (
          <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
            Inactive
          </span>
        )}

      </td>

      <td className="px-5 py-5 text-slate-400">

        {formatDate(
          customer.createdAt
        )}

      </td>

      <td className="px-5 py-5">

        <Link
          href={`/admin/customers/${customer.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition"
        >

          <Eye size={16} />

          View

        </Link>

      </td>

    </tr>
  );
}