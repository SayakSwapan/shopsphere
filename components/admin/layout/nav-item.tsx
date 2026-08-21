import Link from "next/link";
import {
  LayoutDashboard,
  Package2,
  Shapes,
  Ruler,
  Users2,
  ShoppingBag,
  Warehouse,
  Settings,
  FileText,
  Star,
  Truck,
  TicketPercent,
  MapPin,
  RotateCcw,
  RefreshCw,
  Mail,
  Image,
  Globe,
  KeyRound,
  CircleHelp,
  MailPlus,
  MessageCircle,
  PhoneCall,
  DollarSign,
  Percent,
  Palette,
  LayoutGrid,
  Heart,
  TableProperties,
  BookOpen,
  CalendarClock,
  BadgeIndianRupee,
  Printer,
  Zap,
  Archive,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  type: "item";
  item: NavItem;
}

export interface NavSection {
  type: "section";
  title: string;
  icon: LucideIcon;
  children: NavItem[];
}

export type NavEntry = NavGroup | NavSection;

export const navItems: NavEntry[] = [
  {
    type: "item",
    item: { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  },
  {
    type: "item",
    item: { title: "Guide", href: "/admin/guide", icon: BookOpen },
  },
  {
    type: "item",
    item: { title: "Security", href: "/admin/security", icon: ShieldCheck },
  },
  {
    type: "section",
    title: "Orders & Returns",
    icon: ShoppingBag,
    children: [
      { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { title: "Archived Orders", href: "/admin/orders/archived", icon: Archive },
      { title: "Returns", href: "/admin/returns", icon: RotateCcw },
      { title: "Replacements", href: "/admin/replacements", icon: RefreshCw },
      { title: "Return Reasons", href: "/admin/return-reasons", icon: CircleHelp },
      { title: "Product Queries", href: "/admin/product-queries", icon: MessageCircle },
    ],
  },
  {
    type: "section",
    title: "Products & Catalog",
    icon: Package2,
    children: [
      { title: "Products", href: "/admin/products", icon: Package2 },
      { title: "Categories", href: "/admin/categories", icon: Shapes },
      { title: "Gender", href: "/admin/genders", icon: Users2 },
      { title: "Sizes", href: "/admin/sizes", icon: Ruler },
      { title: "Size Charts", href: "/admin/size-charts", icon: TableProperties },
      { title: "Print Types", href: "/admin/print-types", icon: Printer },
      { title: "Inventory", href: "/admin/inventory", icon: Warehouse },
    ],
  },
  {
    type: "section",
    title: "Customers & Partners",
    icon: Users2,
    children: [
      { title: "Customers", href: "/admin/customers", icon: Users2 },
      { title: "Wishlists", href: "/admin/wishlists", icon: Heart },
      { title: "Partners", href: "/admin/partners", icon: Users2 },
      { title: "Permissions", href: "/admin/partners/permissions", icon: KeyRound },
    ],
  },
  {
    type: "section",
    title: "Marketing",
    icon: TicketPercent,
    children: [
      { title: "Coupons", href: "/admin/coupons", icon: TicketPercent },
      { title: "Banners", href: "/admin/banners", icon: Image },
      { title: "Homepage Content", href: "/admin/home-content", icon: LayoutGrid },
      { title: "Sports Homepage", href: "/admin/sports-home-content", icon: Zap },
      { title: "Theme Decider", href: "/admin/theme-decider", icon: Palette },
    ],
  },
  {
    type: "section",
    title: "Finance & Shipping",
    icon: DollarSign,
    children: [
      { title: "Finance", href: "/admin/finance", icon: DollarSign },
      { title: "Balance Sheet", href: "/admin/balance-sheet", icon: FileText },
      { title: "Refunds", href: "/admin/refunds", icon: BadgeIndianRupee },
      { title: "Domains & Bills", href: "/admin/domain-payments", icon: CalendarClock },
      { title: "Transaction Charges", href: "/admin/transaction-charges", icon: Percent },
      { title: "Shipping", href: "/admin/shipping", icon: Truck },
      { title: "Pincodes", href: "/admin/pincodes", icon: MapPin },
    ],
  },
  {
    type: "section",
    title: "Content",
    icon: Mail,
    children: [
      { title: "Reviews", href: "/admin/reviews", icon: Star },
      { title: "Messages", href: "/admin/messages", icon: Mail },
      { title: "Callbacks", href: "/admin/callbacks", icon: PhoneCall },
      { title: "Email Templates", href: "/admin/email-templates", icon: MailPlus },
      { title: "WhatsApp Templates", href: "/admin/whatsapp-templates", icon: MessageCircle },
      { title: "FAQs", href: "/admin/faqs", icon: CircleHelp },
      { title: "Policies", href: "/admin/policies", icon: FileText },
    ],
  },
  {
    type: "section",
    title: "Settings",
    icon: Settings,
    children: [
      { title: "Site Settings", href: "/admin/site-settings", icon: Globe },
      { title: "General", href: "/admin/settings", icon: Settings },
    ],
  },
];

interface NavItemComponentProps {
  href: string;
  title: string;
  icon: LucideIcon;
}

export default function NavItem({ href, title, icon: Icon }: NavItemComponentProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
    >
      <Icon size={20} />
      <span className="text-sm font-medium">{title}</span>
    </Link>
  );
}
