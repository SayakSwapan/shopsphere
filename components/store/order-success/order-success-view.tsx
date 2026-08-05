"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  PackageCheck,
  PartyPopper,
  ShieldCheck,
  Truck,
  ArrowRight,
  Clock,
} from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/format";

interface OrderItemView {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  quantity: number;
  price: number;
  total: number;
  variant: string | null;
}

interface OrderViewData {
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  transactionFee: number;
  totalItems: number;
  items: OrderItemView[];
  paymentMethod: string;
  paymentStatus: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  deliveryFrom: string;
  deliveryTo: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

export default function OrderSuccessView({ order }: { order: OrderViewData }) {
  const totalItems = order.totalItems;
  const isPaid = order.paymentStatus === "PAID";

  const steps = [
    { label: "Order Placed", icon: CheckCircle2, done: true },
    { label: "Processing", icon: Package, done: false },
    { label: "Shipped", icon: Truck, done: false },
    { label: "Delivered", icon: PackageCheck, done: false },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      {/* ── HERO ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        className="relative text-center"
      >
        <div className="os-hero-deco" aria-hidden />

        <motion.div variants={fadeUp} className="relative mx-auto h-28 w-28">
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/25"
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5,
            }}
          />
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/15"
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.9,
            }}
          />
          <motion.div
            className="os-badge-grad relative flex h-28 w-28 items-center justify-center rounded-full"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <motion.svg
              viewBox="0 0 52 52"
              className="h-14 w-14"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.2 }}
            >
              <motion.path
                d="M14 27l8 8 16-16"
                fill="none"
                stroke="#ffffff"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
              />
            </motion.svg>
          </motion.div>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-8 text-3xl font-black text-text-heading sm:text-5xl"
          style={{ fontFamily: "var(--t-font-heading)" }}
        >
          Order Placed{" "}
          <span className="text-primary">Successfully</span>
        </motion.h1>

        <motion.div variants={fadeUp} className="os-flourish mt-5">
          <span className="os-flourish-line" />
          <span className="os-flourish-dot" />
          <span className="os-flourish-line right" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-5 flex max-w-xl items-center justify-center gap-2 text-sm text-text-muted-1 sm:text-base"
        >
          <PartyPopper size={18} className="text-primary" />
          Thank you for shopping with us. Your order has been received and is
          being processed.
        </motion.p>

        {/* Meta chips */}
        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <div className="os-chip rounded-full px-5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted-2">
              Order Number
            </p>
            <p className="mt-0.5 text-sm font-black text-primary">
              {order.orderNumber}
            </p>
          </div>
          <div className="os-chip rounded-full px-5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted-2">
              Placed On
            </p>
            <p className="mt-0.5 text-sm font-black text-text-heading">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="os-chip rounded-full px-5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted-2">
              Payment
            </p>
            <p className="mt-0.5 text-sm font-black text-text-heading">
              {order.paymentMethod === "COD"
                ? "Cash on Delivery"
                : "Online Payment"}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── ESTIMATED DELIVERY ── */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={fadeUp}
        className="os-chip mx-auto mt-8 flex max-w-xl items-center justify-center gap-3 rounded-xl px-5 py-3.5"
      >
        <Clock size={20} className="shrink-0 text-primary" />
        <p className="text-sm text-text-body">
          <span className="font-bold text-text-heading">Estimated delivery:</span>{" "}
          {formatDate(order.deliveryFrom)} – {formatDate(order.deliveryTo)}
        </p>
      </motion.div>

      {/* ── WHAT HAPPENS NEXT ── */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.label}
              variants={fadeUp}
              className={`os-step flex items-center gap-3 rounded-xl px-4 py-3 ${
                step.done ? "os-step-done" : ""
              }`}
            >
              <span className="os-step-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                <Icon size={17} />
              </span>
              <span
                className={`text-xs font-bold sm:text-sm ${
                  step.done ? "text-primary" : "text-text-muted-1"
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── BODY GRID ── */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <motion.div
          className="lg:col-span-2"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.div
            variants={fadeUp}
            className="overflow-hidden border border-border-card bg-bg-card"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center bg-primary/10 text-primary"
                  style={{ borderRadius: "var(--t-radius-button)" }}
                >
                  <Package size={18} />
                </div>
                <h2
                  className="text-base font-bold text-text-heading sm:text-lg"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  {totalItems} Item{totalItems !== 1 ? "s" : ""}
                </h2>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted-2">
                Prices incl. taxes
              </span>
            </div>

            <div className="divide-y divide-border-subtle">
              {order.items.map((item) => (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  className="px-4 py-4 sm:px-6 sm:py-5"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="group flex items-start gap-3 sm:gap-5"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden bg-bg-card-nested sm:h-20 sm:w-20">
                      <Image
                        src={item.imageUrl || "/placeholder.png"}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-bold text-text-heading sm:text-base">
                        {item.name}
                      </h4>
                      {item.variant && (
                        <p className="mt-1 text-xs text-text-muted-2">
                          {item.variant}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                        <span className="text-text-muted-1">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-text-muted-3">•</span>
                        <span className="text-text-muted-1">
                          {formatCurrency(item.price)} each
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-black text-text-heading sm:text-base">
                        {formatCurrency(item.total)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="mt-0.5 text-[10px] text-text-muted-2 sm:text-xs">
                          {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price summary */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.div
              variants={fadeUp}
              className="border border-border-card bg-bg-card p-4 sm:p-6"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <h2
                className="mb-4 text-base font-bold text-text-heading sm:text-lg"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Price Summary
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted-1">
                    Item Total ({totalItems} item{totalItems !== 1 ? "s" : ""})
                  </span>
                  <span className="text-text-heading">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted-1">Coupon Discount</span>
                    <span className="font-medium text-primary">
                      −{formatCurrency(order.discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-text-muted-1">Delivery</span>
                  {order.shipping === 0 ? (
                    <span className="font-bold text-primary">FREE</span>
                  ) : (
                    <span className="text-text-heading">
                      {formatCurrency(order.shipping)}
                    </span>
                  )}
                </div>

                <p className="!mt-1 text-[11px] text-text-muted-2">
                  All prices shown include applicable taxes.
                </p>

                <div className="!mt-3 border-t border-border-subtle pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-text-heading">
                      Total Paid
                    </span>
                    <motion.span
                      className="text-lg font-black text-primary sm:text-xl"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 1.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 16,
                      }}
                    >
                      {formatCurrency(order.totalAmount)}
                    </motion.span>
                  </div>
                </div>

                {order.discount > 0 && (
                  <p className="pt-1 text-xs font-medium text-primary">
                    You saved {formatCurrency(order.discount)} on this order
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Address + payment */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="space-y-6"
          >
            <motion.div
              variants={fadeUp}
              className="overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 sm:px-6">
                <MapPin size={18} className="text-primary" />
                <h3
                  className="text-sm font-bold text-text-heading sm:text-base"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  Delivery Address
                </h3>
              </div>
              <div className="space-y-1 p-4 text-sm text-text-body sm:px-6">
                <p className="font-bold text-text-heading">{order.fullName}</p>
                <p>{order.addressLine1}</p>
                {order.addressLine2 && <p>{order.addressLine2}</p>}
                <p>
                  {order.city}, {order.state} {order.pincode}
                </p>
                <p>{order.country}</p>
                <p className="pt-2 text-xs text-text-muted-2">
                  Phone: {order.phone}
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 sm:px-6">
                <CreditCard size={18} className="text-primary" />
                <h3
                  className="text-sm font-bold text-text-heading sm:text-base"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  Payment
                </h3>
              </div>
              <div className="space-y-3 p-4 text-sm sm:px-6">
                <div className="flex justify-between">
                  <span className="text-text-muted-1">Method</span>
                  <span className="font-medium text-text-heading">
                    {order.paymentMethod === "COD"
                      ? "Cash on Delivery"
                      : "Online Payment"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted-1">Status</span>
                  <span
                    className={`flex items-center gap-1.5 font-bold ${
                      isPaid
                        ? "text-primary"
                        : order.paymentStatus === "FAILED"
                        ? "text-danger"
                        : "text-text-muted-1"
                    }`}
                  >
                    <ShieldCheck size={15} />
                    {isPaid
                      ? "Paid"
                      : order.paymentStatus === "FAILED"
                      ? "Failed"
                      : "Pay on Delivery"}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        className="mt-10 grid gap-4 sm:grid-cols-2"
      >
        <motion.div variants={fadeUp}>
          <Link
            href="/account/orders"
            className="group flex items-center justify-center gap-2 py-4 font-black transition hover:opacity-85"
            style={{
              background: "var(--t-primary)",
              color: "var(--t-bg-page)",
              borderRadius: "var(--t-radius-button)",
            }}
          >
            <Truck size={18} />
            Track Order
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 border border-border-card py-4 font-black text-text-heading transition hover:bg-bg-card-nested"
            style={{ borderRadius: "var(--t-radius-button)" }}
          >
            <Check size={18} className="text-primary" />
            Continue Shopping
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
