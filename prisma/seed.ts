import { PrismaClient } from "@prisma/client";
import { PERMISSIONS } from "@/lib/auth/permission-list";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const DEFAULT_SETTINGS: { key: string; value: string; group: string; label: string }[] = [
  { key: "site_name", value: "ShopSphere", group: "footer", label: "Site Name" },
  { key: "footer_tagline", value: "Premium marketplace for fashion, footwear, accessories and lifestyle products.", group: "footer", label: "Footer Tagline" },
  { key: "copyright_text", value: "All Rights Reserved.", group: "footer", label: "Copyright Text" },
  { key: "about_heading", value: "About ShopSphere", group: "about", label: "About Heading" },
  { key: "about_text", value: "<h2>Our Story</h2><p>ShopSphere is a premium marketplace dedicated to bringing you the best in fashion, footwear, accessories, and lifestyle products. We believe that style should be accessible to everyone, and we work tirelessly to curate a collection that reflects the latest trends while maintaining timeless quality.</p><p>Founded with a passion for excellence, we partner with trusted brands and emerging designers to offer a diverse range of products that cater to every taste and occasion. From casual essentials to statement pieces, every item in our collection is handpicked for its quality, design, and value.</p><h2>Our Mission</h2><p>To provide a seamless shopping experience that combines exceptional product quality with outstanding customer service. We are committed to making every interaction with ShopSphere enjoyable, reliable, and rewarding.</p>", group: "about", label: "About Text" },
  { key: "announcement_text", value: "Free shipping on orders above ₹499! Use code: FREESHIP", group: "announcement", label: "Announcement Text" },
  { key: "announcement_enabled", value: "true", group: "announcement", label: "Announcement Enabled" },
  { key: "social_facebook", value: "https://facebook.com/shopsphere", group: "social", label: "Facebook URL" },
  { key: "social_instagram", value: "https://instagram.com/shopsphere", group: "social", label: "Instagram URL" },
  { key: "social_twitter", value: "https://twitter.com/shopsphere", group: "social", label: "Twitter URL" },
  { key: "social_youtube", value: "https://youtube.com/@shopsphere", group: "social", label: "YouTube URL" },
  { key: "ticker_texts", value: "Free shipping over ₹999|New arrivals weekly|Easy 30-day returns|Premium quality guarantee|Exclusive member deals", group: "homepage", label: "Ticker Texts (separate with |)" },
  { key: "contact_email", value: "support@shopsphere.com", group: "contact", label: "Contact Email" },
  { key: "contact_phone", value: "+91 98765 43210", group: "contact", label: "Contact Phone" },
  { key: "contact_address", value: "Mumbai, Maharashtra, India", group: "contact", label: "Contact Address" },
  { key: "business_hours", value: "Monday - Friday|9:00 AM - 6:00 PM\nSaturday|10:00 AM - 4:00 PM\nSunday|Closed", group: "contact", label: "Business Hours (pipe-separated)" },
  { key: "business_name", value: "ShopSphere Retail Pvt. Ltd.", group: "invoice", label: "Business Name" },
  { key: "gstin", value: "", group: "invoice", label: "GSTIN" },
  { key: "business_address", value: "Shop No. 12, MG Road, Mumbai, Maharashtra 400001", group: "invoice", label: "Business Address" },
  { key: "business_phone", value: "+91 98765 43210", group: "invoice", label: "Business Phone" },
  { key: "business_email", value: "support@shopsphere.com", group: "invoice", label: "Business Email" },
  { key: "invoice_notes", value: "Goods once sold will not be taken back or exchanged unless defective.", group: "invoice", label: "Invoice Footer Notes" },
];

async function main() {
  console.log("Seeding permissions...");

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        name: permission.name,
      },
      update: {
        displayName: permission.displayName,
        module: permission.module,
        category: permission.category,
        description: permission.description ?? null,
      },
      create: {
        name: permission.name,
        displayName: permission.displayName,
        module: permission.module,
        category: permission.category,
        description: permission.description ?? null,
      },
    });
  }

  console.log(`${PERMISSIONS.length} permissions synced.`);

  console.log("Seeding admin user...");

  const adminEmail = "admin@gmail.com";
  const adminPassword = "123456";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      isVerified: true,
      emailVerified: true,
    },
  });

  console.log(`Admin user seeded: ${adminEmail}`);

  console.log("Seeding site settings...");

  for (const setting of DEFAULT_SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value, group: setting.group, label: setting.label },
    });
  }

  console.log(`${DEFAULT_SETTINGS.length} site settings seeded.`);

  console.log("Seeding return/replacement reasons...");

  const RETURN_REASONS = [
    { type: "RETURN", question: "Why are you returning this product?", options: "Damaged Product|Broken Product|Wrong Product|Defective Product|Missing Accessories|Size Issue|Quality Issue|Other", sortOrder: 1 },
    { type: "REPLACEMENT", question: "Why do you need a replacement?", options: "Product Damaged|Broken|Defective|Wrong Product|Missing Accessories|Size Issue|Quality Issue|Other", sortOrder: 2 },
    { type: "BOTH", question: "Common reasons", options: "Items Missing from Package|Received in Bad Condition|Color Not as Expected|Other", sortOrder: 3 },
  ];

  for (const reason of RETURN_REASONS) {
    const existing = await prisma.returnReason.findFirst({
      where: { type: reason.type, question: reason.question },
    });
    if (existing) {
      await prisma.returnReason.update({
        where: { id: existing.id },
        data: { options: reason.options, sortOrder: reason.sortOrder, isActive: true },
      });
    } else {
      await prisma.returnReason.create({ data: reason });
    }
  }

  console.log(`${RETURN_REASONS.length} return reason sets seeded.`);

  console.log("Seeding FAQs...");

  const DEFAULT_FAQS: {
    question: string;
    answer: string;
    sortOrder: number;
  }[] = [
    {
      sortOrder: 1,
      question: "How do I place an order?",
      answer:
        "Simply browse our collection and add the items you like to your cart by selecting a size and quantity. When you are ready, go to your cart, click Checkout, enter your shipping address, choose a payment method (online payment via Razorpay or Cash on Delivery, where available), and place the order. You will receive an order confirmation with your order number shortly after.",
    },
    {
      sortOrder: 2,
      question: "What payment methods do you accept?",
      answer:
        "We accept online payments securely through Razorpay — including UPI, credit cards, debit cards and net-banking — as well as Cash on Delivery (COD) on serviceable pincodes. The available options are shown at checkout based on your delivery address.",
    },
    {
      sortOrder: 3,
      question: "Is Cash on Delivery (COD) available?",
      answer:
        "Yes, we support Cash on Delivery for most serviceable pincodes. However, some pincodes may only support online payment or only COD. You will see the exact options available for your address at checkout before you confirm the order.",
    },
    {
      sortOrder: 4,
      question: "How long will my order take to arrive?",
      answer:
        "Delivery times depend on your pincode. The estimated delivery days for your area are shown at checkout before you place the order. Most orders within our serviceable network arrive within the time shown, and you can track the status from My Orders.",
    },
    {
      sortOrder: 5,
      question: "How can I track my order?",
      answer:
        "Log in to your account and go to My Orders. Open the order to see its live status as it moves through Confirmed, Packed, Shipped, Out for Delivery, and Delivered. We also share relevant tracking and delivery updates as your order progresses.",
    },
    {
      sortOrder: 6,
      question: "Do you offer free shipping?",
      answer:
        "Yes. Whenever free shipping is enabled, orders that meet the free-shipping threshold get free delivery automatically. Some coupons also include free shipping — once applied, the shipping charge is removed. The final shipping cost (or free-shipping eligibility) is always shown at checkout.",
    },
    {
      sortOrder: 7,
      question: "What is your return policy?",
      answer:
        "Products marked as returnable on the product page can be returned within the return window shown for that product, as long as the order has been delivered. To raise a return, go to My Orders, open the delivered order, and click Request Return. Select your reason, provide your refund details (bank or UPI), and submit. For damaged, broken, defective, or wrong items, please upload 3 to 5 clear photos as proof.",
    },
    {
      sortOrder: 8,
      question: "How do I request a return?",
      answer:
        "Log in to your account and open My Orders. Find the delivered order and click Request Return. Fill in the reason, choose your refund method (bank account details or UPI ID), and upload photos if the issue involves damage or a defective/broken/wrong item. Our team will review the request, and once approved we will schedule a courier pickup from your order's shipping address.",
    },
    {
      sortOrder: 9,
      question: "Can I exchange or replace my product?",
      answer:
        "Products marked as replaceable on the product page can be requested for replacement within the replacement window shown for that product. Open the delivered order in My Orders, click Request Replacement, choose the reason, upload proof photos if needed, and submit. Once approved, the old item is picked up and the replacement is dispatched to your shipping address.",
    },
    {
      sortOrder: 10,
      question: "When will I get my refund?",
      answer:
        "A refund is initiated only after your return is approved and the item has been picked up by the courier. Bank transfers usually reflect within 3–7 working days after initiation, and UPI refunds usually reflect within a few hours to 2 working days. You can follow the refund status (Refund Initiated / Refund Completed) from your return request page.",
    },
    {
      sortOrder: 11,
      question: "How will my refund be paid out?",
      answer:
        "Returns are refunded to the bank account or UPI ID you provide when raising the return request. Please make sure the details are correct — the refund is sent to the exact account or UPI ID you enter.",
    },
    {
      sortOrder: 12,
      question: "Can I cancel my order?",
      answer:
        "You can request to cancel an order before it is shipped or packed. If your order was paid online and is cancelled before shipment, we refund the full amount. Once an order has been shipped it can no longer be cancelled — instead, you can use the Return or Replacement option after delivery, if the product is eligible.",
    },
    {
      sortOrder: 13,
      question: "Can I personalise or custom-print products?",
      answer:
        "Many products offer custom printing at checkout — you can add a name, a number (000–999), or upload your own design for an additional charge, depending on the product. The options available (name, number or design image) are shown on the product page and are reflected in your final order total.",
    },
    {
      sortOrder: 14,
      question: "How do I choose the right size?",
      answer:
        "Each product page shows its available sizes. Where a size chart is provided, we recommend checking your measurements against it before ordering. If you are unsure between two sizes, we suggest sizing up for a more comfortable fit unless the product fit guide says otherwise.",
    },
    {
      sortOrder: 15,
      question: "Are the products original and authentic?",
      answer:
        "Yes. Every product we list is checked for quality before dispatch, and we stand behind the authenticity and quality of the items we sell. If you receive a product that is not as described, you can raise a return or replacement within the applicable window.",
    },
    {
      sortOrder: 16,
      question: "How do I use a coupon code?",
      answer:
        "At checkout, enter your coupon code in the coupon field before completing the order. The discount is applied instantly and shown in your order summary. Each coupon has its own terms — minimum order value, eligible products, usage limits, and validity dates — which apply automatically.",
    },
    {
      sortOrder: 17,
      question: "My coupon code is not working. What should I do?",
      answer:
        "Coupon codes can fail for a few reasons: the order may not meet the minimum value, the coupon may be product- or user-specific, may have exceeded its usage limit, or may have expired. Please check the coupon's terms and validity. If everything looks correct, contact our support team with the coupon code and we will help you.",
    },
    {
      sortOrder: 18,
      question: "What should I do if I receive a damaged or wrong product?",
      answer:
        "Please do not worry — raise a return or replacement request from My Orders for the delivered order within the applicable window. Select the relevant reason (for example, Damaged, Broken, Defective, or Wrong Product) and upload 3 to 5 clear photos as proof. Our team will review the request and either replace the item or process a refund at our discretion.",
    },
    {
      sortOrder: 19,
      question: "How do I contact customer support?",
      answer:
        "You can reach us through the Contact page on our website, or by email at the support address listed in the footer. Please include your order number and a brief description of the issue so we can resolve it as quickly as possible. We typically respond within one working day.",
    },
    {
      sortOrder: 20,
      question: "Do you deliver to my pincode?",
      answer:
        "We deliver only to pincodes marked as serviceable. At checkout, you can check your pincode to see the estimated delivery days and the payment options available for your address. If your pincode is not serviceable, we are sorry for the inconvenience — our serviceable network is growing regularly.",
    },
  ];

  for (const faq of DEFAULT_FAQS) {
    const existing = await prisma.faq.findFirst({
      where: { question: faq.question },
    });
    if (existing) {
      await prisma.faq.update({
        where: { id: existing.id },
        data: {
          answer: faq.answer,
          sortOrder: faq.sortOrder,
          isActive: true,
        },
      });
    } else {
      await prisma.faq.create({
        data: {
          question: faq.question,
          answer: faq.answer,
          sortOrder: faq.sortOrder,
          isActive: true,
        },
      });
    }
  }

  console.log(`${DEFAULT_FAQS.length} FAQs seeded.`);

  console.log("Seeding business policies...");

  const DEFAULT_POLICIES: {
    title: string;
    slug: string;
    type: string;
    content: string;
  }[] = [
    {
      title: "Return Policy",
      slug: "return-policy",
      type: "Return",
      content:
        "<h2>Return Policy</h2>" +
        "<p>We want you to be completely happy with every purchase. If something is not right, you can raise a return request for eligible products within the return window shown on each product page.</p>" +
        "<h3>1. Who can request a return</h3>" +
        "<ul><li>Only products marked as <strong>returnable</strong> on the product page are eligible for returns.</li><li>Returns can only be requested for orders that have been <strong>successfully delivered</strong>. Orders that are still in transit, out for delivery, or not yet delivered cannot be returned.</li><li>A return can only be requested once per order. If a return request already exists for your order, you cannot submit another one.</li></ul>" +
        "<h3>2. Return window</h3>" +
        "<p>You must raise the return request within the return window (in days) shown on the product page, counting from the day your order is placed. If the return window has expired, the system will not accept the request and your request will be rejected with the message <em>\u201cReturn window expired.\u201d</em></p>" +
        "<h3>3. How to raise a return</h3>" +
        "<ol><li>Log in to your account and go to My Orders.</li><li>Open the delivered order and click <strong>Request Return</strong>.</li><li>Select the reason for the return and, if needed, provide a detailed description.</li><li>Provide your refund details \u2014 a bank account (account holder name, account number, bank, branch and IFSC code) or a valid UPI ID.</li><li>For damages, broken, defective items or wrong product received, you must upload at least 3 and at most 5 clear photos as proof.</li><li>Submit the request. Our team will review it.</li></ol>" +
        "<h3>4. Damage proof requirement</h3>" +
        "<p>If your reason relates to a damaged, broken, defective, or wrong product, you <strong>must upload between 3 and 5 clear photographs</strong> showing the issue. Requests without the required damage proof will not be accepted.</p>" +
        "<h3>5. What happens after you request a return</h3>" +
        "<ul><li><strong>Pending</strong> \u2014 Your request has been submitted and is waiting for review.</li><li><strong>Under Review</strong> \u2014 Our team is checking your request, reason and proof.</li><li><strong>Approved</strong> \u2014 Your return has been approved and a courier pickup will be scheduled from your order's shipping address.</li><li><strong>Pickup Scheduled</strong> \u2014 Pickup date and the order's shipping address are confirmed with the courier.</li><li><strong>Pickup Completed</strong> \u2014 The item has been collected from you and is on its way back to us.</li><li><strong>Refund Initiated</strong> \u2014 Your refund has been initiated to the bank account or UPI ID you provided.</li><li><strong>Refund Completed</strong> \u2014 Your refund has been successfully processed.</li><li><strong>Closed / Completed</strong> \u2014 The return has been fully resolved.</li><li><strong>Rejected</strong> \u2014 The request could not be approved (for example, the return window expired, the item is not eligible, or proof was insufficient).</li></ul>" +
        "<h3>6. Pickup</h3>" +
        "<ul><li>A courier pickup is arranged from the <strong>shipping address on your order</strong>.</li><li>Please keep the item in its original packaging along with any tags and accessories.</li><li>Keep the item unused and in its original condition for the pickup.</li></ul>" +
        "<h3>7. Items that cannot be returned</h3>" +
        "<ul><li>Products that are not marked as returnable on the product page.</li><li>Personalised or custom-printed items (name, number or uploaded design), unless delivered damaged or defective.</li><li>Items already used, washed, or altered after delivery.</li><li>Orders flagged as <strong>no-return</strong> for offline / special sales.</li></ul>" +
        "<h3>8. Need help?</h3>" +
        "<p>If you have any questions about your return, contact our support team and we will be happy to assist you.</p>",
    },
    {
      title: "Refund Policy",
      slug: "refund-policy",
      type: "Return",
      content:
        "<h2>Refund Policy</h2>" +
        "<p>When you make a valid return, your refund is processed securely back to the bank account or UPI ID you provided when you raised the request.</p>" +
        "<h3>1. When is a refund issued?</h3>" +
        "<ul><li>A refund is initiated only after your return has been <strong>approved</strong> and the returned item has been <strong>picked up</strong> by the courier.</li><li>Refunds for returns are processed to the <strong>original payment-related bank account or UPI ID</strong> supplied at the time of the return request.</li></ul>" +
        "<h3>2. Refund method</h3>" +
        "<p>You can choose to receive your refund by either:</p><ul><li><strong>Bank transfer</strong> \u2014 you must provide the account holder name, account number, bank name, branch name, and a valid IFSC code.</li><li><strong>UPI</strong> \u2014 you must provide a valid UPI ID (for example, name@bank).</li></ul>" +
        "<p>Refunds cannot be processed without valid bank or UPI details. Please make sure the details you provide are correct, because the refund will be sent to the exact account or UPI ID you entered.</p>" +
        "<h3>3. What happens after a refund is initiated?</h3>" +
        "<ul><li><strong>Refund Initiated</strong> \u2014 The refund amount has been released to the bank or UPI account and is in transit.</li><li><strong>Refund Completed</strong> \u2014 The money has reached your account. Bank transfers usually reflect within 3\u20137 working days depending on your bank, and UPI refunds usually reflect within a few hours to 2 working days.</li></ul>" +
        "<h3>4. Refund amount</h3>" +
        "<p>The refund amount is the paid value of the returned items as determined by our team. Once a refund is completed and the order is marked as <strong>REFUNDED</strong>, the returned items are restored to our stock and the payment for those items is reversed.</p>" +
        "<h3>5. Timelines</h3>" +
        "<ul><li>Inspection and approval: typically within 2\u20134 working days after pickup.</li><li>Refund processing: typically within 3\u20137 working days after initiation for bank transfers, and faster for UPI.</li></ul>" +
        "<h3>6. Need a refund for a wrong or missing amount?</h3>" +
        "<p>Contact our support team with your order number and refund details, and we will investigate and resolve it quickly.</p>",
    },
    {
      title: "Replacement / Exchange Policy",
      slug: "replacement-exchange-policy",
      type: "Exchange",
      content:
        "<h2>Replacement / Exchange Policy</h2>" +
        "<p>If you receive a product that is wrong, broken, defective, or damaged, you can request a replacement instead of a refund, within the replacement window shown on the product page.</p>" +
        "<h3>1. Who can request a replacement</h3>" +
        "<ul><li>Only products marked as <strong>replaceable</strong> on the product page are eligible for replacement.</li><li>Replacements can only be requested for <strong>delivered</strong> orders.</li><li>Only one replacement can be requested per order.</li></ul>" +
        "<h3>2. Replacement window</h3>" +
        "<p>You must request the replacement within the replacement window (in days) shown on the product page. Requests made after the window has expired will be rejected with the message <em>\u201cReplacement window expired.\u201d</em></p>" +
        "<h3>3. How to request a replacement</h3>" +
        "<ol><li>Log in to your account and go to My Orders.</li><li>Open the delivered order and click <strong>Request Replacement</strong>.</li><li>Select the reason (Product Damaged, Broken, Defective, Wrong Product, Missing Accessories, Size Issue, Quality Issue, or Other).</li><li>For damages, broken, defective or wrong items, upload between <strong>3 and 5 clear photos</strong> as proof.</li><li>Submit your request.</li></ol>" +
        "<h3>4. What happens after you request a replacement</h3>" +
        "<ul><li><strong>Pending</strong> \u2014 Awaiting review.</li><li><strong>Under Review</strong> \u2014 Our team is checking your request.</li><li><strong>Approved</strong> \u2014 Pickup of the old item is scheduled from your shipping address.</li><li><strong>Pickup Scheduled</strong> \u2014 Pickup date and address confirmed.</li><li><strong>Pickup Completed</strong> \u2014 The old item has been collected.</li><li><strong>Replacement Dispatched</strong> \u2014 Your replacement item has been shipped from our warehouse.</li><li><strong>Out for Delivery</strong> \u2014 Your replacement is with the delivery agent.</li><li><strong>Replacement Delivered</strong> \u2014 Your replacement has been delivered successfully.</li><li><strong>Completed / Closed</strong> \u2014 The replacement is fully resolved.</li><li><strong>Rejected</strong> \u2014 The request could not be approved.</li></ul>" +
        "<h3>5. Replacement delivery</h3>" +
        "<ul><li>Replacements are dispatched only after the original item has been picked up and verified.</li><li>Your replacement will be delivered to the shipping address on your order.</li></ul>" +
        "<h3>6. Need help?</h3>" +
        "<p>If you need assistance with a replacement, contact our support team.</p>",
    },
    {
      title: "Shipping & Delivery Policy",
      slug: "shipping-delivery-policy",
      type: "Shipping",
      content:
        "<h2>Shipping & Delivery Policy</h2>" +
        "<p>We aim to deliver your orders quickly and reliably to the pincode on your shipping address.</p>" +
        "<h3>1. Shipping charges</h3>" +
        "<ul><li>Shipping is calculated at checkout based on the weight of your items and the applicable shipping rules for your destination.</li><li>Whenever <strong>free shipping</strong> is enabled (either as a store-wide offer or through a shipping rule), orders that meet the free-shipping threshold qualify for free delivery.</li><li>Some coupons also include free shipping \u2014 when applied, the shipping charge is removed automatically.</li></ul>" +
        "<h3>2. Delivery estimate</h3>" +
        "<ul><li>The estimated delivery time shown at checkout depends on your pincode and may differ for different locations.</li><li>Estimated delivery days for each pincode are displayed before you confirm the order.</li></ul>" +
        "<h3>3. Pincode availability</h3>" +
        "<ul><li>We deliver only to pincodes that are marked as serviceable.</li><li>For serviceable pincodes, both online payment and Cash on Delivery (COD) may be available. Some pincodes may support only online payment, or only COD \u2014 this is shown at checkout.</li></ul>" +
        "<h3>4. Order tracking</h3>" +
        "<ul><li>Once your order is shipped, you can track it from My Orders.</li><li>You will receive updates as your order moves through Confirmed, Packed, Shipped, Out for Delivery, and Delivered.</li></ul>" +
        "<h3>5. Delivery responsibility</h3>" +
        "<ul><li>Please provide a correct and complete shipping address at checkout.</li><li>We are not responsible for delays caused by incorrect addresses or unavailability of the recipient.</li></ul>",
    },
    {
      title: "Warranty Policy",
      slug: "warranty-policy",
      type: "Warranty",
      content:
        "<h2>Warranty Policy</h2>" +
        "<p>We stand behind the quality of the products we sell.</p>" +
        "<h3>1. Product quality promise</h3>" +
        "<p>All products are checked for quality before dispatch. If you receive a product that is defective, damaged, broken, or not as described, please report it to us within the applicable return / replacement window.</p>" +
        "<h3>2. Who is covered</h3>" +
        "<ul><li>This promise covers manufacturing defects and damage in transit.</li><li>It does not cover normal wear and tear, misuse, accidental damage, unauthorised repairs, or alterations made after delivery.</li></ul>" +
        "<h3>3. Personalised items</h3>" +
        "<ul><li>Custom-printed items (name, number or uploaded design) are produced to your specific request.</li><li>They can only be returned or replaced if they are delivered damaged or defective, or if the print is materially wrong. Please ensure you review your personalisation details carefully before ordering.</li></ul>" +
        "<h3>4. How to claim</h3>" +
        "<ol><li>Raise a return or replacement request from My Orders for the delivered order.</li><li>Select your reason and upload the required proof photos.</li><li>Our team will review and process your claim.</li></ol>" +
        "<h3>5. Resolution</h3>" +
        "<p>Depending on the product and the nature of the issue, we will either provide a replacement or process a refund at our discretion.</p>",
    },
    {
      title: "Terms & Conditions",
      slug: "terms-conditions",
      type: "General",
      content:
        "<h2>Terms & Conditions</h2>" +
        "<p>These terms and conditions govern your use of our website and the purchase of products from our store. By placing an order, you agree to these terms.</p>" +
        "<h3>1. Orders & acceptance</h3>" +
        "<ul><li>All orders are subject to acceptance and availability.</li><li>We reserve the right to cancel any order for any reason, including pricing errors, stock unavailability, or suspected fraud. If we cancel an order after payment, we will refund the full amount.</li></ul>" +
        "<h3>2. Pricing & payment</h3>" +
        "<ul><li>All prices are displayed including or excluding applicable taxes as shown at checkout.</li><li>We accept the payment methods shown at checkout (online payments via Razorpay and Cash on Delivery where available).</li><li>For offline / special sales, alternative payment arrangements may apply.</li></ul>" +
        "<h3>3. Product information</h3>" +
        "<ul><li>We make every effort to display product images, colours and descriptions accurately. Actual colours may vary slightly due to screen settings.</li></ul>" +
        "<h3>4. Coupons & promotions</h3>" +
        "<ul><li>Coupons are subject to their own terms, including minimum order value, eligible products, usage limits, and validity dates.</li><li>We reserve the right to modify or discontinue promotions at any time.</li></ul>" +
        "<h3>5. Limitation of liability</h3>" +
        "<ul><li>To the maximum extent permitted by law, our liability is limited to the value of the products purchased.</li><li>We are not liable for any indirect, incidental, or consequential damages arising from the use of the website or the products.</li></ul>" +
        "<h3>6. Governing law</h3>" +
        "<p>These terms are governed by the laws of India and any disputes are subject to the exclusive jurisdiction of the courts where we operate.</p>" +
        "<h3>7. Changes to terms</h3>" +
        "<p>We may update these terms from time to time. The latest version will always be available on this page and will apply to any orders placed after the update.</p>",
    },
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      type: "General",
      content:
        "<h2>Privacy Policy</h2>" +
        "<p>Your privacy is important to us. This policy explains how we collect, use and protect your personal information.</p>" +
        "<h3>1. Information we collect</h3>" +
        "<ul><li><strong>Account information:</strong> your name, email, phone number, and password.</li><li><strong>Address information:</strong> shipping and billing addresses for order delivery.</li><li><strong>Payment information:</strong> payment details are processed securely by our payment partner (Razorpay). We do not store full payment card details.</li><li><strong>Refund details:</strong> bank account or UPI details you provide to receive a refund.</li><li><strong>Order data:</strong> your purchase history, return / replacement requests, and customer support interactions.</li></ul>" +
        "<h3>2. How we use your information</h3>" +
        "<ul><li>To process and deliver your orders.</li><li>To process refunds and replacements.</li><li>To provide customer support and respond to your queries.</li><li>To send order updates and, with your consent, promotional communications.</li><li>To improve our products, services and website.</li><li>To prevent fraud and ensure a secure shopping experience.</li></ul>" +
        "<h3>3. Sharing of information</h3>" +
        "<ul><li>We share information only with the service providers needed to fulfil your order (for example, payment processors, delivery / courier partners, and cloud storage providers).</li><li>We do not sell your personal information to third parties.</li></ul>" +
        "<h3>4. Data security</h3>" +
        "<ul><li>We use industry-standard security measures to protect your data.</li><li>Passwords are stored in a secure, hashed form.</li></ul>" +
        "<h3>5. Your rights</h3>" +
        "<ul><li>You may access, update, or delete your account information at any time from your account settings.</li><li>You may contact us to request access to or deletion of your personal data.</li></ul>" +
        "<h3>6. Contact us</h3>" +
        "<p>If you have any questions about this privacy policy or your data, please contact our support team.</p>",
    },
    {
      title: "Cancellation Policy",
      slug: "cancellation-policy",
      type: "General",
      content:
        "<h2>Cancellation Policy</h2>" +
        "<p>This policy explains when and how you can cancel an order.</p>" +
        "<h3>1. Before shipment</h3>" +
        "<ul><li>You may request to cancel an order before it is shipped / packed.</li><li>If the order was paid online and is cancelled before shipment, the full amount will be refunded to your original payment method or the refund details you provide.</li></ul>" +
        "<h3>2. After shipment</h3>" +
        "<ul><li>Once an order is shipped, it cannot be cancelled. Instead, you may use the <strong>Return</strong> or <strong>Replacement</strong> option after the order is delivered, if the product is eligible.</li></ul>" +
        "<h3>3. COD orders</h3>" +
        "<ul><li>If you do not accept a Cash on Delivery order or fail to pay at delivery, the order may be marked as cancelled or returned as undeliverable.</li></ul>" +
        "<h3>4. Refunds on cancellation</h3>" +
        "<ul><li>Approved cancellations with a paid order are refunded in full. The refund may take a few working days to reflect, depending on your bank.</li></ul>" +
        "<h3>5. Need help?</h3>" +
        "<p>Contact our support team if you need help cancelling an order.</p>",
    },
  ];

  for (const policy of DEFAULT_POLICIES) {
    const existing = await prisma.policy.findUnique({
      where: { slug: policy.slug },
    });
    if (existing) {
      await prisma.policy.update({
        where: { id: existing.id },
        data: {
          title: policy.title,
          type: policy.type,
          content: policy.content,
          isActive: true,
        },
      });
    } else {
      await prisma.policy.create({
        data: {
          id: crypto.randomUUID(),
          title: policy.title,
          slug: policy.slug,
          type: policy.type,
          content: policy.content,
          isActive: true,
        },
      });
    }
  }

  console.log(`${DEFAULT_POLICIES.length} business policies seeded.`);

  console.log("Seeding sports marquee phrases...");

  const DEFAULT_MARQUEE_PHRASES = [
    "Train Hard",
    "Play Pro",
    "Authentic Gear",
    "Same-Day Ship",
    "Built To Last",
    "Game Day Ready",
    "Team Verified",
    "Zero Compromise",
  ];

  const marqueeCount = await prisma.sportsMarqueeItem.count();
  if (marqueeCount === 0) {
    await prisma.sportsMarqueeItem.createMany({
      data: DEFAULT_MARQUEE_PHRASES.map((phrase, index) => ({
        phrase,
        sortOrder: index + 1,
        isActive: true,
      })),
    });
    console.log(`${DEFAULT_MARQUEE_PHRASES.length} sports marquee phrases seeded.`);
  } else {
    console.log("Sports marquee phrases already exist, skipping.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });