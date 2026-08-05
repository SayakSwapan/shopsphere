import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ShoppingBag,
  RotateCcw,
  RefreshCw,
  MessageCircle,
  BadgeIndianRupee,
  Package2,
  Users2,
  TicketPercent,
  DollarSign,
  CalendarClock,
  Mail,
  Settings,
} from "lucide-react";

import type { WorkflowDiagramData } from "@/components/admin/guides/workflow-diagram";

export interface GuideStep {
  title: string;
  detail: string;
}

export interface GuideSection {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  steps: GuideStep[];
  tips?: string[];
  diagram?: WorkflowDiagramData[];
}

export const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Getting Started",
    description:
      "Log in, understand the dashboard at a glance, and learn the daily admin routine.",
    steps: [
      {
        title: "Log in",
        detail:
          "Go to /admin/login. If this is your first time, you will see a setup form. Enter your name, email, and a password (minimum 8 characters), then click 'Create Admin & Login'.",
      },
      {
        title: "Dashboard overview",
        detail:
          "After login, you land on the dashboard. Here you'll see key metrics: total orders, revenue, customer count, recent orders, and sales charts. Use this as your command center.",
      },
      {
        title: "Sidebar navigation",
        detail:
          "The left sidebar groups all management areas into collapsible sections (Orders & Returns, Products & Catalog, Finance & Shipping, etc.). Click any section title to expand it and reveal the sub-pages. The active page is highlighted in amber.",
      },
      {
        title: "Top bar utilities",
        detail:
          "The top bar shows notifications (bell icon) and your admin profile. Use the hamburger menu (☰) on mobile to toggle the sidebar.",
      },
    ],
    tips: [
      "Bookmark /admin/dashboard for quick access.",
      "Start each day by checking open product queries and pending return/replacement requests.",
      "Use the browser back/forward to navigate between admin pages.",
    ],
    diagram: [
      {
        title: "Daily Admin Workflow",
        nodes: [
          {
            type: "start",
            title: "Log in to the dashboard",
            detail:
              "Head to /admin/login. First-time users are asked to create the admin account.",
            phase: "Login",
          },
          {
            type: "action",
            title: "Scan key metrics",
            detail:
              "Check total orders, revenue, and open requests. The dashboard surfaces anything that needs attention.",
          },
          {
            type: "decision",
            title: "Any new orders or requests?",
            detail:
              "Open Orders & Returns to see pending orders, returns, replacements, and product queries.",
            branches: [
              {
                label: "Yes",
                tone: "green",
                outcome: "Process them before they pile up — order statuses, return approvals, query replies.",
              },
              {
                label: "No",
                tone: "slate",
                outcome: "Continue monitoring; nothing needs immediate action.",
              },
            ],
          },
          {
            type: "action",
            title: "Fulfil & support",
            detail:
              "Move orders to Shipped/Delivered, approve or reject return/replacement requests, and answer customer queries.",
            phase: "Operations",
          },
          {
            type: "action",
            title: "Review finances weekly",
            detail:
              "Open Finance & Shipping → Finance to review revenue, expenses, refunds, and the balance sheet.",
          },
          {
            type: "end",
            title: "Stay on top of the store",
            detail:
              "A short daily check keeps fulfilment, support, and finances running smoothly.",
            phase: "Done",
          },
        ],
      },
    ],
  },
  {
    id: "orders",
    icon: ShoppingBag,
    title: "Orders",
    description:
      "Process customer orders through the full fulfilment pipeline.",
    steps: [
      {
        title: "View Orders",
        detail:
          "Go to Orders & Returns → Orders. The list shows all orders with status, amount, and date. Click any order to view details: items, shipping address, payment info, and status timeline.",
      },
      {
        title: "Update Order Status",
        detail:
          "Inside an order detail page, use the status controls to move the order through the pipeline. Online orders: Pending → Confirmed → Paid → Packed → Shipped → Out for Delivery → Delivered. COD orders: Confirmed → Packed → Shipped → Out for Delivery → Delivered → Paid — cash is collected at delivery, so payment is marked received only after the parcel reaches the customer. Each status change can trigger notifications to the customer.",
      },
      {
        title: "Cancel an Order",
        detail:
          "If a customer requests cancellation before dispatch, use the cancel action on the order detail page. Cancelled orders become terminal — they can't continue through fulfilment. Refund any captured payment through the customer support flow.",
      },
      {
        title: "Add Order Notes",
        detail:
          "Add detailed internal notes to orders for reference by you or a partner. These are visible only in the admin area.",
      },
    ],
    tips: [
      "Process orders daily to maintain good customer experience.",
      "For online orders, always verify payment confirmation before packing.",
      "For COD orders, collect the cash at delivery and only then mark the order Paid.",
      "Add detailed notes to orders for internal reference.",
    ],
    diagram: [
      {
        title: "Order Fulfilment Lifecycle",
        nodes: [
          {
            type: "start",
            title: "Order placed",
            detail:
              "Customer checks out and the order appears as PENDING. Verify the payment before proceeding.",
            phase: "Placed",
          },
          {
            type: "action",
            title: "Confirm order",
            detail:
              "Verify order details and stock availability, then mark the order as CONFIRMED.",
          },
          {
            type: "action",
            title: "Payment received",
            detail:
              "Confirm the online payment cleared and mark the order PAID. (For COD orders, this step happens after delivery instead.)",
            phase: "Payment",
          },
          {
            type: "action",
            title: "Pack items",
            detail:
              "Pack the items securely and mark the order PACKED, ready for dispatch.",
            phase: "Dispatch",
          },
          {
            type: "action",
            title: "Ship order",
            detail:
              "Hand the parcel to the courier and mark the order SHIPPED. Add the tracking number if available.",
          },
          {
            type: "action",
            title: "Out for delivery",
            detail:
              "The parcel is with the delivery agent on its way to the customer (OUT_FOR_DELIVERY).",
          },
          {
            type: "end",
            title: "Delivered",
            detail:
              "The customer confirms delivery and the order is marked DELIVERED — fulfilment is complete.",
            phase: "Complete",
          },
        ],
      },
      {
        title: "COD Order Fulfilment Lifecycle",
        nodes: [
          {
            type: "start",
            title: "Order placed",
            detail:
              "Customer checks out with Cash on Delivery and the order appears as PENDING.",
            phase: "Placed",
          },
          {
            type: "action",
            title: "Confirm order",
            detail:
              "Verify order details and stock availability, then mark the order as CONFIRMED.",
          },
          {
            type: "action",
            title: "Pack items",
            detail:
              "Pack the items securely and mark the order PACKED, ready for dispatch.",
            phase: "Dispatch",
          },
          {
            type: "action",
            title: "Ship order",
            detail:
              "Hand the parcel to the courier and mark the order SHIPPED. Add the tracking number if available.",
          },
          {
            type: "action",
            title: "Out for delivery",
            detail:
              "The parcel is with the delivery agent on its way to the customer (OUT_FOR_DELIVERY).",
          },
          {
            type: "action",
            title: "Delivered",
            detail:
              "The customer receives the parcel and pays the cash amount on delivery.",
          },
          {
            type: "end",
            title: "Payment received",
            detail:
              "Mark the order PAID once the cash has been collected at delivery. This completes the order.",
            phase: "Complete",
          },
        ],
      },
    ],
  },
  {
    id: "returns",
    icon: RotateCcw,
    title: "Returns",
    description:
      "Review return requests, schedule pickup, and process refunds end to end.",
    steps: [
      {
        title: "Review Return Requests",
        detail:
          "Go to Orders & Returns → Returns. The list shows every return request. Click any request to open its detail page, where you'll see the customer details, shipping address, order items, and the reason with evidence images.",
      },
      {
        title: "Approve or Reject",
        detail:
          "Use the status buttons to approve or reject a return. Approving schedules a courier pickup from the order's shipping address. Rejected requests stay closed.",
      },
      {
        title: "Track Pickup",
        detail:
          "Move the return through PICKUP_SCHEDULED → PICKUP_COMPLETED as the courier picks up and you receive the product back. Verify the returned item's condition before continuing.",
      },
      {
        title: "Collect Bank Details",
        detail:
          "Once a return is approved, ask the customer to submit their refund bank details (account number twice, branch name, and IFSC) from their request page. The refund can't be initiated until these are on file.",
      },
      {
        title: "Initiate & Complete Refund",
        detail:
          "After you receive the product, initiate the refund with the cost price. This creates a row in the refund ledger. Once the money is transferred, mark the refund COMPLETED to close the return.",
      },
      {
        title: "Configure Return Reasons",
        detail:
          "Go to Orders & Returns → Return Reasons. Add common reasons customers can select when requesting returns (e.g., 'Size too large', 'Damaged product'). Keep these clear and concise.",
      },
    ],
    tips: [
      "Common return reasons reduce customer friction.",
      "Verify the returned product's condition before initiating a refund.",
      "Always confirm bank details are on file before clicking 'Initiate Refund'.",
    ],
    diagram: [
      {
        title: "Return Request Lifecycle",
        nodes: [
          {
            type: "start",
            title: "Request submitted",
            detail:
              "Customer raises a return with a reason and evidence images. Status is PENDING.",
            phase: "Request",
          },
          {
            type: "action",
            title: "Review evidence",
            detail:
              "Open the request and check the reason, evidence, and order items. Status moves to UNDER_REVIEW.",
            phase: "Review",
          },
          {
            type: "decision",
            title: "Approve the return?",
            detail:
              "Decide based on the return policy and the evidence submitted.",
            branches: [
              {
                label: "Approve",
                tone: "green",
                outcome: "Status becomes APPROVED and a courier pickup is scheduled.",
              },
              {
                label: "Reject",
                tone: "red",
                outcome: "The request is rejected and stays closed. The customer is notified.",
              },
            ],
          },
          {
            type: "action",
            title: "Schedule pickup",
            detail:
              "Confirm the pickup date and the order's shipping address with the courier (PICKUP_SCHEDULED). Ask the customer to submit refund bank details now.",
            phase: "Return Pickup",
          },
          {
            type: "action",
            title: "Receive product",
            detail:
              "The courier collects the parcel and you receive it back. Verify the condition and mark PICKUP_COMPLETED.",
          },
          {
            type: "action",
            title: "Initiate refund",
            detail:
              "Using the customer's bank details on file, initiate the refund for the cost price. This creates a ledger entry with status INITIATED.",
            phase: "Refund",
          },
          {
            type: "end",
            title: "Refund completed",
            detail:
              "Once the money is transferred to the customer's account, mark the refund COMPLETED. The return is closed.",
          },
        ],
      },
    ],
  },
  {
    id: "replacements",
    icon: RefreshCw,
    title: "Replacements",
    description:
      "Approve replacement requests, collect the old item, and dispatch a new one.",
    steps: [
      {
        title: "Review Replacement Requests",
        detail:
          "Go to Orders & Returns → Replacements. Click any request to open its detail page with full customer and order information, plus the reason and evidence images.",
      },
      {
        title: "Approve or Reject",
        detail:
          "Approve a valid replacement to initiate pickup of the old item. Rejected requests stay closed.",
      },
      {
        title: "Receive the Old Item",
        detail:
          "Schedule and complete the pickup of the old product (PICKUP_SCHEDULED → PICKUP_COMPLETED). Only after receiving it can the replacement be dispatched.",
      },
      {
        title: "Dispatch the Replacement",
        detail:
          "Ship the replacement from the warehouse (REPLACEMENT_SHIPPED), then track it through OUT_FOR_DELIVERY until it is DELIVERED.",
      },
      {
        title: "Complete the Request",
        detail:
          "Once the replacement is delivered, mark the request COMPLETED to close it.",
      },
    ],
    tips: [
      "Never dispatch the replacement before the old item is received and verified.",
      "Add the tracking number when dispatching so the customer can follow the delivery.",
    ],
    diagram: [
      {
        title: "Replacement Request Lifecycle",
        nodes: [
          {
            type: "start",
            title: "Request submitted",
            detail:
              "Customer raises a replacement request with a reason and evidence. Status is PENDING.",
            phase: "Request",
          },
          {
            type: "action",
            title: "Review evidence",
            detail:
              "Open the request and verify the reason and evidence against the order. Status moves to UNDER_REVIEW.",
            phase: "Review",
          },
          {
            type: "decision",
            title: "Approve the replacement?",
            detail:
              "Decide based on the return policy and the evidence submitted.",
            branches: [
              {
                label: "Approve",
                tone: "green",
                outcome: "Status becomes APPROVED and a pickup is scheduled for the old item.",
              },
              {
                label: "Reject",
                tone: "red",
                outcome: "The request is rejected and stays closed.",
              },
            ],
          },
          {
            type: "action",
            title: "Pickup old item",
            detail:
              "Confirm the pickup date and address, then receive the old product (PICKUP_SCHEDULED → PICKUP_COMPLETED).",
            phase: "Return Pickup",
          },
          {
            type: "action",
            title: "Dispatch replacement",
            detail:
              "Ship the new item from the warehouse and add the tracking number (REPLACEMENT_SHIPPED).",
            phase: "Replacement Delivery",
          },
          {
            type: "action",
            title: "Out for delivery",
            detail:
              "The replacement is with the delivery agent heading to the customer (REPLACEMENT_OUT_FOR_DELIVERY).",
          },
          {
            type: "end",
            title: "Delivered & closed",
            detail:
              "Replacement reaches the customer (REPLACEMENT_DELIVERED), then the request is marked COMPLETED.",
          },
        ],
      },
    ],
  },
  {
    id: "product-queries",
    icon: MessageCircle,
    title: "Product Queries",
    description:
      "Answer customer questions about products in their orders and close them out.",
    steps: [
      {
        title: "Monitor Open Queries",
        detail:
          "Go to Orders & Returns → Product Queries. The list shows every question a customer asked about a product in their order, with the latest message and the current status. The header shows the total and how many are still OPEN.",
      },
      {
        title: "Open a Query",
        detail:
          "Click a query to open its detail page. You'll see the full conversation thread, the related product (with its selling price), the linked order, and the customer's contact details.",
      },
      {
        title: "Reply to the Customer",
        detail:
          "Type your answer in the conversation box and send it. The customer can respond back, so keep the thread going until their question is fully answered.",
      },
      {
        title: "Resolve and Close",
        detail:
          "Once the customer is satisfied, mark the query RESOLVED. Closed queries stay in the list for reference but no longer require attention.",
      },
    ],
    tips: [
      "Answer open queries promptly — a fast reply improves the buying experience.",
      "Jump to the customer's profile or the linked order directly from the query detail page.",
      "Resolve queries as soon as the conversation is complete to keep the open count clean.",
    ],
    diagram: [
      {
        title: "Product Query Resolution Flow",
        nodes: [
          {
            type: "start",
            title: "Customer asks a question",
            detail:
              "A customer asks about a product in their order. The query appears with status OPEN.",
            phase: "Opened",
          },
          {
            type: "action",
            title: "Review the conversation",
            detail:
              "Read the thread, the linked product, the order, and the customer details on the query page.",
          },
          {
            type: "action",
            title: "Send a reply",
            detail:
              "Answer in the conversation box. The customer can follow up with more questions.",
          },
          {
            type: "decision",
            title: "Is the customer satisfied?",
            detail:
              "Did the answer fully resolve their question?",
            branches: [
              {
                label: "Yes",
                tone: "green",
                outcome: "Mark the query RESOLVED.",
              },
              {
                label: "No",
                tone: "amber",
                outcome: "Keep replying in the thread until it is resolved.",
              },
            ],
          },
          {
            type: "action",
            title: "Mark resolved",
            detail:
              "Set the status to RESOLVED once the question is answered to the customer's satisfaction.",
            phase: "Resolution",
          },
          {
            type: "end",
            title: "Closed",
            detail:
              "The query is closed and stored for reference. No further action is needed.",
          },
        ],
      },
    ],
  },
  {
    id: "refunds",
    icon: BadgeIndianRupee,
    title: "Refunds",
    description:
      "Track every refund from initiation to payout in a single ledger.",
    steps: [
      {
        title: "Open the Refund Ledger",
        detail:
          "Go to Finance & Shipping → Refunds. The ledger lists every refund initiated from a return or replacement, newest first. Summary cards show the total initiated, total completed, and amounts still in progress.",
      },
      {
        title: "Understand the Columns",
        detail:
          "Each row shows the date, order, customer, request type (Return or Replacement), amount, method, masked bank details, who initiated it, and the status (Initiated or Completed). Click the order number or the 'View' button to jump to the source request.",
      },
      {
        title: "Filter by Status",
        detail:
          "Use the status dropdown to show only Initiated (awaiting payout) or Completed (paid out) refunds.",
      },
      {
        title: "Follow Through to Completion",
        detail:
          "A refund is created when a return/replacement moves to 'Refund Initiated'. After you transfer the money to the customer's account, mark the refund COMPLETED on the request page — this also reflects it in Finance and the Balance Sheet.",
      },
    ],
    tips: [
      "Review the ledger weekly to make sure no initiated refund is left unpaid.",
      "Bank account numbers are masked everywhere in the admin for security.",
      "Completed refunds reduce profit automatically in Finance and the Balance Sheet.",
    ],
    diagram: [
      {
        title: "Refund Lifecycle (Return / Replacement)",
        nodes: [
          {
            type: "start",
            title: "Return or replacement approved",
            detail:
              "The request is approved and pickup of the product is underway.",
            phase: "Request",
          },
          {
            type: "action",
            title: "Customer submits bank details",
            detail:
              "From their request page, the customer enters the account number twice, branch name, and IFSC. These are validated before saving.",
          },
          {
            type: "action",
            title: "Receive and verify the product",
            detail:
              "Mark the pickup complete once the returned/replaced item is received and its condition is verified.",
            phase: "Pickup",
          },
          {
            type: "action",
            title: "Initiate the refund",
            detail:
              "Using the customer's bank details, initiate the refund for the cost price. A refund ledger row is created with status INITIATED.",
            phase: "Refund",
          },
          {
            type: "decision",
            title: "Was the money transferred?",
            detail:
              "Confirm the transfer to the customer's account before closing the refund.",
            branches: [
              {
                label: "Yes",
                tone: "green",
                outcome: "Mark the refund COMPLETED — the payout is done and the request closes.",
              },
              {
                label: "Not yet",
                tone: "amber",
                outcome: "Leave the refund INITIATED and process the payout shortly.",
              },
            ],
          },
          {
            type: "end",
            title: "Refund completed",
            detail:
              "The completed amount is reflected in Finance, the Balance Sheet, and the refund ledger.",
          },
        ],
      },
    ],
  },
  {
    id: "products",
    icon: Package2,
    title: "Products & Catalog",
    description:
      "Create and manage your product catalog, categories, sizes, and inventory.",
    steps: [
      {
        title: "Add a Category",
        detail:
          "Go to Products & Catalog → Categories. Click 'Add Category'. Enter a name, optional description, upload an image, and set the sort order. Enable/disable as needed. Categories help organize products on the storefront.",
      },
      {
        title: "Add Gender",
        detail:
          "Go to Products & Catalog → Gender. Click 'Add Gender'. Enter a name (e.g., Male, Female, Kids) and set it active. Gender filters products on the storefront.",
      },
      {
        title: "Add Sizes",
        detail:
          "Go to Products & Catalog → Sizes. Click 'Add Size'. Select the size category (CLOTHING / SHOES), choose the gender, enter the size code (e.g., M, UK-10), name, and unit. Sizes are linked to products later.",
      },
      {
        title: "Create a Size Chart",
        detail:
          "Go to Products & Catalog → Size Charts. Click 'Add Size Chart'. Select the gender and category, then add measurement rows (body part, inch/cm values). Upload a reference image. Size charts display on product pages.",
      },
      {
        title: "Add a Product",
        detail:
          "Go to Products & Catalog → Products. Click 'Add Product'. Fill in: name, description, category, gender, base price, discount %, stock quantity, and product images. Select applicable sizes from the size matrix. Toggle 'Featured' to highlight it on the homepage. Click 'Save'.",
      },
      {
        title: "Manage Inventory",
        detail:
          "Go to Products & Catalog → Inventory. View stock levels across all products and variants and update stock quantities directly. Low-stock items are highlighted for attention.",
      },
    ],
    tips: [
      "Upload high-quality product images (at least 800x800 px).",
      "Set a meaningful sort order on categories to control storefront display.",
      "Use the 'Featured' flag to showcase 4-8 products on the homepage.",
    ],
    diagram: [
      {
        title: "Publishing a Product",
        nodes: [
          {
            type: "start",
            title: "Set up catalog foundations",
            detail:
              "Create the category, gender, sizes, and size charts the product will reference.",
            phase: "Catalog Setup",
          },
          {
            type: "action",
            title: "Add the product",
            detail:
              "Fill in name, description, category, gender, price, discount, and stock. Upload product images.",
          },
          {
            type: "action",
            title: "Link sizes",
            detail:
              "Select the applicable sizes from the size matrix so the correct variants are purchasable.",
            phase: "Variants",
          },
          {
            type: "action",
            title: "Set featured flag",
            detail:
              "Toggle 'Featured' to showcase the product on the homepage.",
          },
          {
            type: "action",
            title: "Save and verify",
            detail:
              "Click 'Save', then open the storefront product page to confirm the details and images look right.",
          },
          {
            type: "end",
            title: "Live on the storefront",
            detail:
              "The product is visible to customers. Keep an eye on inventory in the Inventory page.",
          },
        ],
      },
    ],
  },
  {
    id: "customers",
    icon: Users2,
    title: "Customers & Partners",
    description:
      "Manage customer accounts, wishlists, partners, and access permissions.",
    steps: [
      {
        title: "Browse Customers",
        detail:
          "Go to Customers & Partners → Customers. The list shows all registered customers with their email, phone, order count, and status. Use the search bar to find specific customers.",
      },
      {
        title: "View Customer Details",
        detail:
          "Click a customer to see their profile: personal info, order history, wishlist items, and account activity. You can verify their account, toggle active status, or send WhatsApp messages from here.",
      },
      {
        title: "Manage Partners",
        detail:
          "Go to Customers & Partners → Partners. Partners are sub-admins with limited access. Add partners by entering their details and assigning specific permissions.",
      },
      {
        title: "Set Permissions",
        detail:
          "Go to Customers & Partners → Permissions. Define granular access for each partner — which sections they can view, edit, or manage. Permissions are role-based and can be customized per partner.",
      },
      {
        title: "View Wishlists",
        detail:
          "Go to Customers & Partners → Wishlists. Browse all customer wishlists to understand demand trends. You can also send coupon offers to customers for items in their wishlist.",
      },
    ],
    tips: [
      "Verify customer emails before granting full account access.",
      "Use wishlist data to inform inventory and marketing decisions.",
      "Partner permissions should follow the principle of least privilege.",
    ],
    diagram: [
      {
        title: "Customer Support Workflow",
        nodes: [
          {
            type: "start",
            title: "Customer registers",
            detail:
              "A customer creates an account on the storefront and appears in the Customers list.",
            phase: "Account",
          },
          {
            type: "action",
            title: "Review the profile",
            detail:
              "Open the customer profile to see personal info, orders, wishlist, and activity.",
          },
          {
            type: "decision",
            title: "Verify the account?",
            detail:
              "Confirm the email and identity before granting full access.",
            branches: [
              {
                label: "Verify",
                tone: "green",
                outcome: "Mark the account verified — full access is granted.",
              },
              {
                label: "Suspend",
                tone: "red",
                outcome: "Toggle the account inactive if there are issues (fraud, abuse).",
              },
            ],
          },
          {
            type: "action",
            title: "Engage the customer",
            detail:
              "Send WhatsApp messages or offer coupons for wishlist items to encourage purchases.",
            phase: "Engagement",
          },
          {
            type: "action",
            title: "Grant partner access (if needed)",
            detail:
              "For sub-admins, add a partner and assign scoped permissions.",
          },
          {
            type: "end",
            title: "Healthy customer base",
            detail:
              "Verified, engaged customers drive repeat business.",
          },
        ],
      },
    ],
  },
  {
    id: "marketing",
    icon: TicketPercent,
    title: "Marketing & Promotions",
    description:
      "Create coupons, manage banners, and customize homepage content.",
    steps: [
      {
        title: "Create a Coupon",
        detail:
          "Go to Marketing → Coupons. Click 'Add Coupon'. Set the coupon code, discount type (percentage or fixed), value, minimum order amount, usage limit, and expiry date. Save to activate. Customers can apply codes at checkout.",
      },
      {
        title: "Add Banners",
        detail:
          "Go to Marketing → Banners. Click 'Add Banner'. Upload a banner image (recommended 1920x500 px), set the title, subtitle, and a link URL. Set the sort order to control display sequence on the homepage slider.",
      },
      {
        title: "Manage Homepage Content",
        detail:
          "Go to Marketing → Homepage Content. Add feature cards that appear on the storefront. Each card has an icon, title, description, and link. These highlight key offerings like 'Free Shipping' or '24/7 Support'.",
      },
      {
        title: "Use Theme Decider",
        detail:
          "Go to Marketing → Theme Decider. Toggle between available store themes. Preview how your store looks with different color schemes and layouts. Changes apply instantly to the customer-facing store.",
      },
    ],
    tips: [
      "Limited-time coupons create urgency and boost conversions.",
      "Banner images should be optimised for web (under 200 KB).",
      "Keep homepage content updated seasonally.",
    ],
    diagram: [
      {
        title: "Launching a Promotion",
        nodes: [
          {
            type: "start",
            title: "Create a coupon",
            detail:
              "Set the code, discount type (percentage or flat), value, minimum order amount, usage limit, and expiry date.",
            phase: "Offer",
          },
          {
            type: "action",
            title: "Add promotional banners",
            detail:
              "Upload banner images and set their title, link, and sort order for the homepage slider.",
          },
          {
            type: "action",
            title: "Refresh homepage content",
            detail:
              "Update feature cards so the storefront reflects the current campaign.",
            phase: "Storefront",
          },
          {
            type: "action",
            title: "Preview the theme",
            detail:
              "Use Theme Decider to preview how the store looks with different themes.",
          },
          {
            type: "end",
            title: "Promotion is live",
            detail:
              "Customers see the banners and can apply the coupon at checkout. Track results and expiry dates.",
          },
        ],
      },
    ],
  },
  {
    id: "finance",
    icon: DollarSign,
    title: "Finance & Shipping",
    description:
      "Track finances, manage shipping zones, and configure delivery pincodes.",
    steps: [
      {
        title: "Track Finances",
        detail:
          "Go to Finance & Shipping → Finance. View revenue, expenses, profit, and refunds. Add expense entries with category, amount, and notes. Completed refunds are automatically deducted.",
      },
      {
        title: "Balance Sheet",
        detail:
          "Go to Finance & Shipping → Balance Sheet. View a detailed breakdown of all financial transactions. Filter by date range to analyse specific periods. Export reports for accounting.",
      },
      {
        title: "Manage Expenses",
        detail:
          "From the Finance page, click 'Add Expense'. Categorise each expense (e.g., Marketing, Operations, Shipping). Track recurring expenses and view monthly spending trends.",
      },
      {
        title: "Manage Transaction Charges",
        detail:
          "Go to Finance & Shipping → Transaction Charges. Define fee rules that apply to online (Razorpay) payments. Each rule has an amount range (min–max), a fee type (flat ₹ or percentage %), and a sort order. Rules are evaluated in ascending sort order — the first matching rule applies to the order. COD orders are never charged. Use the sort order to prioritise rules: for example, a 2% fee for orders up to ₹1000 at sort order 1, and a flat ₹20 fee for larger orders at sort order 2. Toggle a rule inactive to temporarily skip it without deleting.",
      },
      {
        title: "Configure Shipping",
        detail:
          "Go to Finance & Shipping → Shipping. Add shipping zones and rates. Set rules based on order weight, value, or destination. Define free shipping thresholds to encourage larger orders.",
      },
      {
        title: "Set Up Pincodes",
        detail:
          "Go to Finance & Shipping → Pincodes. Add deliverable pincodes with associated shipping charges and estimated delivery days. This ensures accurate shipping calculations at checkout.",
      },
    ],
    tips: [
      "Review the balance sheet weekly to stay on top of finances.",
      "Set free shipping thresholds slightly above your average order value.",
      "Regularly update pincode coverage as you expand delivery areas.",
      "Order your fee rules with the most specific (lowest max) first, followed by broader fallback rules.",
    ],
    diagram: [
      {
        title: "Monthly Finance Review",
        nodes: [
          {
            type: "start",
            title: "Open Finance",
            detail:
              "Start with the Finance page to see revenue, expenses, and profit for the period.",
            phase: "Overview",
          },
          {
            type: "action",
            title: "Add expense entries",
            detail:
              "Record every expense with a category, amount, and notes so profit stays accurate.",
          },
          {
            type: "action",
            title: "Review transaction charges",
            detail:
              "Confirm fee rules are still correct for online payments and adjust the sort order if rates change.",
            phase: "Costs",
          },
          {
            type: "action",
            title: "Check the refund ledger",
            detail:
              "Make sure every initiated refund has been paid out and marked COMPLETED.",
          },
          {
            type: "action",
            title: "Review the balance sheet",
            detail:
              "Filter by date range and verify the profit picture across revenue, expenses, and refunds.",
            phase: "Reporting",
          },
          {
            type: "end",
            title: "Export reports",
            detail:
              "Export the balance sheet for accounting or tax purposes and keep a copy for your records.",
          },
        ],
      },
    ],
  },
  {
    id: "domain-payments",
    icon: CalendarClock,
    title: "Domains & Bills",
    description:
      "Track domain renewals, hosting, and other recurring charges so nothing lapses.",
    steps: [
      {
        title: "Add a Payment",
        detail:
          "Go to Finance & Shipping → Domains & Bills. Click 'Add Payment'. Enter the provider (e.g., GoDaddy, Namecheap, BigRock), the domain, the service (DOMAIN / HOSTING / SSL / EMAIL / OTHER), the amount, currency, payment method, due date, and optional notes. Toggle 'Auto-renew' if the plan renews automatically.",
      },
      {
        title: "Monitor the Summary Cards",
        detail:
          "The page shows Outstanding (unpaid + overdue), Overdue, Due within 7 days, and Paid this year totals. A banner highlights the next upcoming charge and how many days away it is.",
      },
      {
        title: "Mark a Payment as Paid",
        detail:
          "When you pay a bill, click 'Mark Paid' on the row (or edit the payment and set the status to PAID with a paid date). Paid rows are dimmed and count toward the yearly total.",
      },
      {
        title: "Edit or Delete",
        detail:
          "Use the pencil icon to update provider, amount, due date, or status. Use the trash icon to remove a payment — a confirmation dialog prevents accidental deletion.",
      },
    ],
    tips: [
      "Add every recurring charge the moment it's known so due dates are never missed.",
      "Rely on the 'next upcoming charge' banner to plan cash outflows.",
      "Mark payments PAID promptly so the Outstanding total stays accurate.",
    ],
    diagram: [
      {
        title: "Bill Renewal Workflow",
        nodes: [
          {
            type: "start",
            title: "Add the payment",
            detail:
              "Record provider, domain, service, amount, currency, payment method, due date, and auto-renew status.",
            phase: "Record",
          },
          {
            type: "action",
            title: "Monitor due dates",
            detail:
              "Check the summary cards and the 'next upcoming charge' banner regularly.",
            phase: "Track",
          },
          {
            type: "decision",
            title: "Is the bill due?",
            detail:
              "Review payments that are due soon or overdue.",
            branches: [
              {
                label: "Due / overdue",
                tone: "amber",
                outcome: "Pay the bill, then mark the payment as PAID with the paid date.",
              },
              {
                label: "Not yet",
                tone: "slate",
                outcome: "No action needed — keep monitoring the due date.",
              },
            ],
          },
          {
            type: "action",
            title: "Mark as paid",
            detail:
              "Click 'Mark Paid' or edit the row to set status PAID and the paid date. The row dims and counts toward Paid this year.",
          },
          {
            type: "end",
            title: "Nothing lapses",
            detail:
              "Domains, hosting, and SSL renewals are never missed, keeping the store online.",
            phase: "Renewed",
          },
        ],
      },
    ],
  },
  {
    id: "content",
    icon: Mail,
    title: "Content & Communication",
    description:
      "Manage reviews, messages, templates, FAQs, and legal policies.",
    steps: [
      {
        title: "Manage Reviews",
        detail:
          "Go to Content → Reviews. View all customer product reviews. Approve, reject, or reply to reviews. Approved reviews appear on the storefront product pages and influence buying decisions.",
      },
      {
        title: "Read Messages",
        detail:
          "Go to Content → Messages. View messages sent by customers via the contact form. Reply directly or mark them as resolved. Messages are organised by date.",
      },
      {
        title: "Handle Callback Requests",
        detail:
          "Go to Content → Callbacks. Customers can request a call back from any product page. Each request shows the customer's name, phone (tap to call), linked product, and any message they left. Call them back, then click 'Mark Called' and add an internal note. Close the request once resolved, or reopen it if the customer needs another follow-up. Use the tabs to filter by Pending, Called, or Closed.",
      },
      {
        title: "Create Email Templates",
        detail:
          "Go to Content → Email Templates. Design email templates for automated communication (order confirmation, shipping updates, password reset). Use variables like {{customerName}}, {{orderNumber}} for dynamic content.",
      },
      {
        title: "Set Up WhatsApp Templates",
        detail:
          "Go to Content → WhatsApp Templates. Create message templates for WhatsApp notifications. Include order updates, promotional messages, and cart recovery reminders. Templates require approval before use.",
      },
      {
        title: "Add FAQs",
        detail:
          "Go to Content → FAQs. Add frequently asked questions with answers. Organise them by category. FAQs display on the storefront /faqs page and help reduce support queries.",
      },
      {
        title: "Manage Policies",
        detail:
          "Go to Content → Policies. Create and update legal pages: Privacy Policy, Terms & Conditions, Return Policy, Shipping Policy. These pages are accessible from the storefront footer.",
      },
    ],
    tips: [
      "Respond to customer reviews — both positive and negative.",
      "Use email templates to maintain brand consistency.",
      "Keep policies up to date with your actual business practices.",
    ],
    diagram: [
      {
        title: "Content Review Workflow",
        nodes: [
          {
            type: "start",
            title: "Customer submits content",
            detail:
              "A review, contact message, or callback request arrives from the storefront.",
            phase: "Incoming",
          },
          {
            type: "decision",
            title: "What needs action?",
            detail:
              "Route the item based on its type.",
            branches: [
              {
                label: "Review",
                tone: "amber",
                outcome: "Approve, reject, or reply — approved reviews show on the product page.",
              },
              {
                label: "Message",
                tone: "slate",
                outcome: "Reply to the customer or mark the message resolved.",
              },
              {
                label: "Callback",
                tone: "green",
                outcome: "Call the customer back and mark the request Called, then Closed.",
              },
            ],
          },
          {
            type: "action",
            title: "Keep templates updated",
            detail:
              "Maintain email and WhatsApp templates, FAQs, and policies so responses stay consistent.",
            phase: "Maintenance",
          },
          {
            type: "end",
            title: "Content published & resolved",
            detail:
              "Approved content is live and all support items are closed.",
          },
        ],
      },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings & Configuration",
    description:
      "Configure global site settings, social links, and branding.",
    steps: [
      {
        title: "Site Settings",
        detail:
          "Go to Settings → Site Settings. Configure global settings: site name, description, logo, favicon, contact email, phone number, social media links, and SEO metadata. These affect the entire storefront.",
      },
      {
        title: "General Settings",
        detail:
          "Go to Settings → General. Manage store-wide configurations: currency, tax rates, order prefix, minimum order amount, and other operational settings.",
      },
      {
        title: "Social Links",
        detail:
          "Go to Settings → Site Settings and scroll to the Social Links section. Add links to your social media profiles (Facebook, Instagram, Twitter, YouTube). These appear in the storefront footer.",
      },
      {
        title: "Hero Banners",
        detail:
          "Go to Settings area or Marketing → Banners. Upload full-width hero banners for special promotions or seasonal campaigns. Set call-to-action buttons and target URLs.",
      },
      {
        title: "Brand Logos & Trust Items",
        detail:
          "Go to the respective sections under Settings. Upload brand logos for product brands you carry. Add trust items (payment badges, security seals) to display on the checkout page for customer confidence.",
      },
    ],
    tips: [
      "Upload a favicon (32x32 px) for browser tab identification.",
      "Social links in the footer improve SEO and customer trust.",
      "Test your site after every configuration change.",
    ],
    diagram: [
      {
        title: "Configuring the Store",
        nodes: [
          {
            type: "start",
            title: "Open Site Settings",
            detail:
              "Go to Settings → Site Settings to edit the store name, description, logo, favicon, and SEO metadata.",
            phase: "Branding",
          },
          {
            type: "action",
            title: "Add contact & social links",
            detail:
              "Set the contact email and phone, then add social profiles (Facebook, Instagram, Twitter, YouTube) for the footer.",
          },
          {
            type: "action",
            title: "Set operational defaults",
            detail:
              "In Settings → General, configure currency, tax rates, order prefix, and the minimum order amount.",
            phase: "Operations",
          },
          {
            type: "action",
            title: "Add trust items & logos",
            detail:
              "Upload brand logos and checkout trust badges (payment + security seals).",
          },
          {
            type: "end",
            title: "Test the storefront",
            detail:
              "Visit the storefront to confirm branding, links, and checkout badges all render correctly.",
            phase: "Verified",
          },
        ],
      },
    ],
  },
];
