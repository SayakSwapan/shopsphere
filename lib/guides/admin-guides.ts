export interface GuideStep {
  title: string;
  detail: string;
}

export interface PageGuide {
  pattern: RegExp;
  id: string;
  title: string;
  steps: GuideStep[];
}

export const adminGuides: PageGuide[] = [
  {
    pattern: /^\/admin\/dashboard\/?$/,
    id: "dashboard",
    title: "Dashboard",
    steps: [
      { title: "Overview", detail: "The dashboard shows key metrics: total revenue, orders, customers, and growth charts. Use these widgets to monitor your store's health at a glance." },
      { title: "Filter by period", detail: "Use the date range filter to view metrics for specific periods (7 days, 30 days, or custom). Charts update automatically." },
      { title: "Recent orders", detail: "The recent orders table shows the latest transactions. Click any order to view or manage its details." },
      { title: "Quick actions", detail: "Use the sidebar to navigate to any management section. The top bar shows notifications and your admin profile." },
    ],
  },
  {
    pattern: /^\/admin\/orders\/?$/,
    id: "orders-list",
    title: "Orders List",
    steps: [
      { title: "View all orders", detail: "The orders table lists every order with order number, customer, items count, amount, payment method, status, and date." },
      { title: "Search & filter", detail: "Use the search bar to find orders by order number or customer name. Filter by status using the dropdown." },
      { title: "Change status", detail: "Click the status dropdown on any row to update the order status (Pending → Confirmed → Shipped → Delivered)." },
      { title: "View details", detail: "Click the 'View' button or order number to see full order details, items, payment info, and shipping address." },
    ],
  },
  {
    pattern: /^\/admin\/orders\/[^/]+\/?$/,
    id: "orders-detail",
    title: "Order Detail",
    steps: [
      { title: "Order information", detail: "View complete order details: order number, customer info, items purchased, pricing breakdown, payment status, and shipping address." },
      { title: "Update status", detail: "Use the status selector to advance the order through the fulfillment pipeline. Each status change can be tracked." },
      { title: "Print invoice", detail: "Click the 'Print Invoice' button to generate a printable invoice with full GST breakdown per item." },
      { title: "Customer info", detail: "Review customer details including name, email, phone, and shipping address for fulfillment." },
    ],
  },
  {
    pattern: /^\/admin\/returns\/?$/,
    id: "returns",
    title: "Return Requests",
    steps: [
      { title: "View returns", detail: "The table lists all customer return requests with order details, customer info, reason, status, and submission date." },
      { title: "Approve a return", detail: "For PENDING returns, click 'Approve' to accept the return. The customer will be notified of the approval." },
      { title: "Reject a return", detail: "For PENDING returns, click 'Reject' to decline the return. The customer will see the rejection status." },
      { title: "Complete a return", detail: "For APPROVED returns, click 'Complete (Restore Stock)' to finalise. This restores inventory and marks payment as REFUNDED." },
    ],
  },
  {
    pattern: /^\/admin\/replacements\/?$/,
    id: "replacements",
    title: "Replacement Requests",
    steps: [
      { title: "View replacements", detail: "The table shows all replacement requests with order details, customer info, reason, status, and date." },
      { title: "Approve a replacement", detail: "For PENDING requests, click 'Approve'. This initiates the replacement process." },
      { title: "Mark as shipped", detail: "For APPROVED requests, click 'Mark Shipped' once the replacement item has been dispatched." },
      { title: "Complete a replacement", detail: "For SHIPPED requests, click 'Complete' to finalise. Stock movements are recorded for tracking." },
      { title: "Reject a replacement", detail: "For PENDING requests, click 'Reject' to decline the replacement request." },
    ],
  },
  {
    pattern: /^\/admin\/return-reasons\/?$/,
    id: "return-reasons",
    title: "Return Reasons",
    steps: [
      { title: "View reasons", detail: "The table lists all configured return/replacement reasons with type, question, options, sort order, and active status." },
      { title: "Add a reason", detail: "Click 'Add Reason'. Choose the type (Return, Replacement, or Both), enter a question, and add selectable options." },
      { title: "Edit a reason", detail: "Click the 'Edit' button on any row to modify the reason's type, question, options, or active status." },
      { title: "Delete a reason", detail: "Click the 'Delete' button to remove a reason. This action cannot be undone." },
    ],
  },
  {
    pattern: /^\/admin\/products\/?$/,
    id: "products-list",
    title: "Products List",
    steps: [
      { title: "View products", detail: "The products table shows all products with name, category, base price, selling price, stock, and status." },
      { title: "Search products", detail: "Use the search bar to find products by name. The list updates as you type." },
      { title: "Add a product", detail: "Click 'Add Product' to create a new product. Fill in the details: name, description, category, gender, pricing, stock, and images." },
      { title: "Edit a product", detail: "Click the 'Edit' button on any product row to modify its details, pricing, or settings." },
    ],
  },
  {
    pattern: /^\/admin\/products\/(new|create)\/?$/,
    id: "products-create",
    title: "Add Product",
    steps: [
      { title: "Basic info", detail: "Enter the product name, slug (auto-generated), and a detailed description. Upload multiple product images." },
      { title: "Pricing & stock", detail: "Set the base price, discount percentage (selling price auto-calculates), and initial stock quantity." },
      { title: "Categorisation", detail: "Select the category, gender, and applicable sizes from the size matrix. Choose a size chart if available." },
      { title: "Return policy", detail: "Toggle 'Is Returnable' and 'Is Replaceable' and set the return/replace window in days." },
      { title: "Save", detail: "Click 'Save Product' to create the product. It will appear in the storefront immediately." },
    ],
  },
  {
    pattern: /^\/admin\/products\/(edit|view)\/[^/]+\/?$/,
    id: "products-edit",
    title: "Edit Product",
    steps: [
      { title: "Modify details", detail: "Update any product field: name, description, price, stock, images, category, gender, or sizes." },
      { title: "Manage images", detail: "Upload new images or remove existing ones. The first image is used as the product thumbnail." },
      { title: "Update return policy", detail: "Change the returnable/replaceable settings and update the return/replace window if needed." },
      { title: "Save changes", detail: "Click 'Update Product' to save. Changes reflect immediately on the storefront." },
    ],
  },
  {
    pattern: /^\/admin\/categories\/?$/,
    id: "categories-list",
    title: "Categories",
    steps: [
      { title: "View categories", detail: "The table lists all product categories with name, description, image, product count, sort order, and active status." },
      { title: "Add a category", detail: "Click 'Add Category'. Enter the name, optional description, upload an image, and set the sort order." },
      { title: "Edit a category", detail: "Click the edit icon on any row to update the category name, description, image, or sort order." },
      { title: "Toggle active", detail: "Toggle the active status to show/hide the category on the storefront." },
    ],
  },
  {
    pattern: /^\/admin\/categories\/(new|create)\/?$/,
    id: "categories-create",
    title: "Add Category",
    steps: [
      { title: "Name & description", detail: "Enter a clear category name and an optional description that helps customers understand what's in this category." },
      { title: "Upload image", detail: "Upload a category image (recommended 400x400 px). This appears on the storefront category listing." },
      { title: "Sort order", detail: "Set the sort order to control where this category appears in the list. Lower numbers appear first." },
      { title: "Save", detail: "Click 'Save' to create the category. Enable it if you want it visible on the storefront immediately." },
    ],
  },
  {
    pattern: /^\/admin\/genders\/?$/,
    id: "genders-list",
    title: "Genders",
    steps: [
      { title: "View genders", detail: "The table lists all product genders (e.g., Male, Female, Kids) with associated size counts and status." },
      { title: "Add a gender", detail: "Click 'Add Gender'. Enter a name (e.g., Men, Women, Unisex) and set it active." },
      { title: "Edit a gender", detail: "Click the edit button to update the gender name or toggle its active status." },
    ],
  },
  {
    pattern: /^\/admin\/sizes\/?$/,
    id: "sizes-list",
    title: "Sizes",
    steps: [
      { title: "View sizes", detail: "The table shows all sizes grouped by gender with size code, name, unit, and category (CLOTHING/SHOES)." },
      { title: "Add a size", detail: "Click 'Add Size'. Select the gender, size category, enter the size code (e.g., M, UK-10), name, and unit." },
      { title: "Edit a size", detail: "Click the edit button to modify any size attribute." },
    ],
  },
  {
    pattern: /^\/admin\/size-charts\/?$/,
    id: "size-charts",
    title: "Size Charts",
    steps: [
      { title: "View size charts", detail: "The table lists measurement templates for clothing and shoes. Each chart shows body measurements." },
      { title: "Add a size chart", detail: "Click 'Add Size Chart'. Select gender and category, then add measurement rows (body part, inch/cm values). Upload a reference image." },
      { title: "Edit a size chart", detail: "Click the edit button to modify measurements, image, or assigned products." },
    ],
  },
  {
    pattern: /^\/admin\/inventory\/?$/,
    id: "inventory",
    title: "Inventory Management",
    steps: [
      { title: "View stock levels", detail: "The inventory page shows each product's current stock, low-stock threshold, and out-of-stock count." },
      { title: "Update stock", detail: "Adjust stock quantities directly for any product. Use positive values to add stock, negative to remove." },
      { title: "Low stock alerts", detail: "Products below the threshold are highlighted. Restock these items to avoid stockouts." },
    ],
  },
  {
    pattern: /^\/admin\/customers\/?$/,
    id: "customers-list",
    title: "Customers",
    steps: [
      { title: "View customers", detail: "The table lists all registered customers with email, phone, order count, and account status." },
      { title: "Search customers", detail: "Use the search bar to find customers by name, email, or phone number." },
      { title: "View details", detail: "Click a customer to see their profile: personal info, order history, wishlist, and account activity." },
      { title: "Manage status", detail: "Toggle active status to enable/disable customer accounts. Verify email addresses from the detail page." },
    ],
  },
  {
    pattern: /^\/admin\/coupons\/?$/,
    id: "coupons-list",
    title: "Coupons",
    steps: [
      { title: "View coupons", detail: "The table lists all discount coupons with code, type, value, minimum order, usage count, expiry, and active status." },
      { title: "Add a coupon", detail: "Click 'Add Coupon'. Set the code, discount type (% or fixed), value, minimum order, usage limit, and expiry date." },
      { title: "Edit a coupon", detail: "Click the edit button to modify any coupon parameters." },
      { title: "Toggle active", detail: "Enable or disable coupons as needed. Expired coupons are automatically inactive." },
    ],
  },
  {
    pattern: /^\/admin\/banners\/?$/,
    id: "banners-list",
    title: "Banners",
    steps: [
      { title: "View banners", detail: "The table lists homepage slider banners with image, title, subtitle, and sort order." },
      { title: "Add a banner", detail: "Click 'Add Banner'. Upload an image (1920x500 px recommended), set title, subtitle, link URL, and sort order." },
      { title: "Reorder banners", detail: "Use drag-and-drop to rearrange banner display order on the homepage slider." },
      { title: "Edit/delete", detail: "Click the edit icon to modify a banner. Delete to remove it from the slider." },
    ],
  },
  {
    pattern: /^\/admin\/home-content\/?$/,
    id: "home-content",
    title: "Homepage Content",
    steps: [
      { title: "View content", detail: "Manage feature cards and promo banners displayed on the storefront homepage." },
      { title: "Add feature card", detail: "Click 'Add' to create a feature card with icon, title, description, and link URL." },
      { title: "Reorder", detail: "Drag to reorder how feature cards appear on the homepage." },
      { title: "Edit/delete", detail: "Modify existing content or remove items that are no longer needed." },
    ],
  },
  {
    pattern: /^\/admin\/theme-decider\/?$/,
    id: "theme-decider",
    title: "Theme Decider",
    steps: [
      { title: "Browse themes", detail: "View available storefront themes with preview thumbnails." },
      { title: "Preview theme", detail: "Click a theme to see how your store will look with different color schemes and layouts." },
      { title: "Apply theme", detail: "Click 'Apply' to activate a theme. Changes reflect instantly on the customer-facing store." },
    ],
  },
  {
    pattern: /^\/admin\/finance\/?$/,
    id: "finance",
    title: "Finance Overview",
    steps: [
      { title: "View financials", detail: "See revenue, cost of goods sold (COGS), gross profit, net profit, and expense summaries." },
      { title: "Filter period", detail: "Switch between daily, weekly, and monthly views. Use date filters for custom periods." },
      { title: "Track expenses", detail: "Click 'Expenses' to view or add expense entries with category, amount, and notes." },
      { title: "Export data", detail: "Use the export options to download financial reports for accounting." },
    ],
  },
  {
    pattern: /^\/admin\/balance-sheet\/?$/,
    id: "balance-sheet",
    title: "Balance Sheet",
    steps: [
      { title: "View balance sheet", detail: "Comprehensive view of all financial transactions including revenue, expenses, and profit/loss." },
      { title: "Filter", detail: "Filter by date range to analyse specific periods." },
      { title: "Export", detail: "Export the balance sheet data for external accounting software." },
    ],
  },
  {
    pattern: /^\/admin\/shipping\/?$/,
    id: "shipping",
    title: "Shipping Rules",
    steps: [
      { title: "View rules", detail: "The table lists shipping rules with zone, charge type, conditions, and priority." },
      { title: "Add a rule", detail: "Click 'Add Shipping Rule'. Set the shipping zone, charge method (flat/weight/value), conditions, and amount." },
      { title: "Set priorities", detail: "Rules are evaluated by priority. Lower numbers are checked first." },
      { title: "Free shipping", detail: "Configure free shipping thresholds to encourage larger orders." },
    ],
  },
  {
    pattern: /^\/admin\/pincodes\/?$/,
    id: "pincodes",
    title: "Pincodes",
    steps: [
      { title: "View pincodes", detail: "The table lists all serviceable pincodes with associated shipping charges and delivery days." },
      { title: "Add a pincode", detail: "Click 'Add Pincode'. Enter the pincode, shipping charge, and estimated delivery days." },
      { title: "Edit a pincode", detail: "Update shipping charges or delivery estimates for any pincode." },
      { title: "Delete", detail: "Remove pincodes that are no longer serviceable." },
    ],
  },
  {
    pattern: /^\/admin\/reviews\/?$/,
    id: "reviews",
    title: "Reviews",
    steps: [
      { title: "View reviews", detail: "The table lists all customer product reviews with rating, content, product, and customer info." },
      { title: "Approve/reject", detail: "Moderate reviews by approving or rejecting them. Approved reviews appear on product pages." },
      { title: "Reply to reviews", detail: "Respond to customer reviews publicly. Replies appear below the review on the product page." },
    ],
  },
  {
    pattern: /^\/admin\/messages\/?$/,
    id: "messages",
    title: "Contact Messages",
    steps: [
      { title: "View messages", detail: "The table shows customer inquiries from the contact form with name, email, subject, and date." },
      { title: "Read message", detail: "Click a message to view the full inquiry. Unread messages are highlighted." },
      { title: "Reply", detail: "Use the reply form to respond to customer inquiries. Replies are sent via email." },
    ],
  },
  {
    pattern: /^\/admin\/email-templates\/?$/,
    id: "email-templates",
    title: "Email Templates",
    steps: [
      { title: "View templates", detail: "The table lists all transactional email templates with name, subject, and active status." },
      { title: "Edit template", detail: "Click a template to edit its subject, body content, and design. Use variables like {{customerName}} for dynamic content." },
      { title: "Toggle active", detail: "Enable or disable templates. Disabled templates won't be sent to customers." },
    ],
  },
  {
    pattern: /^\/admin\/faqs\/?$/,
    id: "faqs",
    title: "FAQs",
    steps: [
      { title: "View FAQs", detail: "The table lists frequently asked questions sorted by sort order." },
      { title: "Add FAQ", detail: "Click 'Add FAQ'. Enter the question, answer, and set the sort order. Optionally assign a category." },
      { title: "Edit/delete", detail: "Modify existing FAQs or remove outdated ones." },
    ],
  },
  {
    pattern: /^\/admin\/policies\/?$/,
    id: "policies",
    title: "Policies",
    steps: [
      { title: "View policies", detail: "Manage store policies: return policy, shipping policy, warranty, terms & conditions, and privacy policy." },
      { title: "Edit policy", detail: "Click a policy to edit its content. Use the rich text editor to format the policy page." },
      { title: "Publish", detail: "Toggle the published status. Only published policies are visible on the storefront." },
    ],
  },
  {
    pattern: /^\/admin\/site-settings\/?$/,
    id: "site-settings",
    title: "Site Settings",
    steps: [
      { title: "General info", detail: "Configure site name, description, logo, favicon, contact email, and phone number." },
      { title: "Social links", detail: "Add links to your social media profiles. These appear in the storefront footer." },
      { title: "SEO metadata", detail: "Set default meta title, description, and keywords for search engine optimisation." },
      { title: "Footer content", detail: "Manage footer content, about page text, and other site-wide information." },
    ],
  },
  {
    pattern: /^\/admin\/settings\/?$/,
    id: "settings",
    title: "General Settings",
    steps: [
      { title: "Store configuration", detail: "Manage currency, tax rates, order prefix, and minimum order amount." },
      { title: "Business info", detail: "Update business name, address, GST number, and other legal information." },
      { title: "Operational settings", detail: "Configure order processing preferences, notification defaults, and system behaviour." },
    ],
  },
  {
    pattern: /^\/admin\/wishlists\/?$/,
    id: "wishlists",
    title: "Wishlisted Products",
    steps: [
      { title: "View wishlists", detail: "See products sorted by wishlist count. Identify trending and popular items." },
      { title: "Send coupon", detail: "Click 'Send Coupon' to offer a discount to customers who have wishlisted a product." },
      { title: "Analyse demand", detail: "Use wishlist data to inform inventory purchasing and marketing decisions." },
    ],
  },
  {
    pattern: /^\/admin\/analytics\/?$/,
    id: "analytics",
    title: "Analytics",
    steps: [
      { title: "View analytics", detail: "Comprehensive analytics dashboard showing sales trends, customer behaviour, and store performance." },
      { title: "Filter data", detail: "Use date range filters and segment selectors to drill into specific data." },
      { title: "Export reports", detail: "Download analytics reports for offline analysis and presentations." },
    ],
  },
  {
    pattern: /^\/admin\/partners\/?$/,
    id: "partners",
    title: "Partners",
    steps: [
      { title: "View partners", detail: "The table lists all sub-admin partners with their name, email, role, and status." },
      { title: "Add a partner", detail: "Click 'Add Partner'. Enter name, email, and assign specific section permissions." },
      { title: "Manage permissions", detail: "Define granular access — which sections each partner can view, edit, or manage." },
    ],
  },
  {
    pattern: /^\/admin\/hero-banners\/?$/,
    id: "hero-banners",
    title: "Hero Banners",
    steps: [
      { title: "View hero banners", detail: "Manage full-width hero banners for seasonal campaigns and promotions." },
      { title: "Add a banner", detail: "Upload an image, set the call-to-action text, button label, and target URL." },
      { title: "Reorder", detail: "Arrange banners to control their display sequence on the homepage." },
    ],
  },
  {
    pattern: /^\/admin\/brand-logos\/?$/,
    id: "brand-logos",
    title: "Brand Logos",
    steps: [
      { title: "View brand logos", detail: "Manage the brand logo carousel that appears on the homepage." },
      { title: "Add a brand", detail: "Upload a brand logo image and optionally set a link URL." },
      { title: "Reorder", detail: "Arrange brand logos to control their display order in the carousel." },
    ],
  },
  {
    pattern: /^\/admin\/testimonials\/?$/,
    id: "testimonials",
    title: "Testimonials",
    steps: [
      { title: "View testimonials", detail: "Manage customer testimonials displayed on the homepage." },
      { title: "Add a testimonial", detail: "Enter the customer name, their testimonial text, and optionally upload a photo." },
      { title: "Reorder", detail: "Arrange testimonials to feature the best ones prominently." },
    ],
  },
  {
    pattern: /^\/admin\/stat-counters\/?$/,
    id: "stat-counters",
    title: "Stat Counters",
    steps: [
      { title: "View stat counters", detail: "Manage statistics shown on the homepage like '10K+ Products' or '50K+ Happy Customers'." },
      { title: "Add a counter", detail: "Enter the label, value, and optional suffix/prefix for the counter display." },
      { title: "Reorder", detail: "Arrange counters to control their display order." },
    ],
  },
  {
    pattern: /^\/admin\/social-links\/?$/,
    id: "social-links",
    title: "Social Links",
    steps: [
      { title: "View social links", detail: "Manage social media links displayed in the storefront footer." },
      { title: "Add a link", detail: "Select the platform (Facebook, Instagram, Twitter, YouTube, etc.) and enter the profile URL." },
      { title: "Reorder", detail: "Arrange links to control their display order in the footer." },
    ],
  },
  {
    pattern: /^\/admin\/trust-items\/?$/,
    id: "trust-items",
    title: "Trust Items",
    steps: [
      { title: "View trust items", detail: "Manage trust badges shown on checkout (secure payment, free shipping, money-back guarantee, etc.)." },
      { title: "Add a trust item", detail: "Upload an icon, enter a title and description. These build customer confidence at checkout." },
      { title: "Reorder", detail: "Arrange trust items by importance." },
    ],
  },
  {
    pattern: /^\/admin\/footer-links\/?$/,
    id: "footer-links",
    title: "Footer Links",
    steps: [
      { title: "View footer links", detail: "Manage grouped footer navigation links by category (Support, Company, Legal, etc.)." },
      { title: "Add a group", detail: "Create a new link group with a heading. Add links with labels and URLs within each group." },
      { title: "Reorder", detail: "Arrange groups and links to control their display order in the footer." },
    ],
  },
  {
    pattern: /^\/admin\/guide\/?$/,
    id: "guide",
    title: "Admin Guide",
    steps: [
      { title: "Browse topics", detail: "This page provides comprehensive guides for every section of the admin panel. Select a topic from the tabs above." },
      { title: "Follow steps", detail: "Each guide is organised into numbered steps. Follow them in order to complete tasks correctly." },
      { title: "Pro tips", detail: "Look for the 'Pro Tips' section at the bottom of each guide for best practices and recommendations." },
    ],
  },
];

export function findGuideForPath(path: string): PageGuide | undefined {
  return adminGuides.find((g) => g.pattern.test(path));
}
