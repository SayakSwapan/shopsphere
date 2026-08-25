import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const INDIAN_FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Sai", "Rohan", "Vihaan", "Krishna",
  "Ishaan", "Shaurya", "Atharv", "Advik", "Pranav", "Advaith", "Armaan",
  "Ananya", "Diya", "Myra", "Sara", "Aanya", "Aadhya", "Aarohi", "Priya",
  "Nisha", "Kavya", "Riya", "Pooja", "Simran", "Neha", "Meera", "Tanvi",
  "Shreya", "Divya", "Chhavi", "Harshita", "Ishita", "Jaya", "Komal",
  "Rahul", "Amit", "Suresh", "Vikram", "Rajesh", "Sanjay", "Manoj",
  "Sunita", "Geeta", "Rekha", "Suman", "Pallavi", "Deepa", "Savita",
  "Aakash", "Deepak", "Nitin", "Mohan", "Ramesh", "Sunil", "Tarun",
  "Lakshmi", "Saroj", "Usha", "Vandana", "Nandini", "Suchitra", "Bharti",
];

const INDIAN_LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Nair",
  "Iyer", "Mishra", "Pandey", "Tiwari", "Choudhary", "Joshi", "Rao",
  "Mehta", "Desai", "Kapoor", "Malhotra", "Chopra", "Sinha", "Bhatt",
  "Kulkarni", "Deshpande", "Pillai", "Menon", "Das", "Banerjee", "Mukherjee",
  "Chatterjee", "Ghosh", "Sen", "Bose", "Roy", "Dutta", "Lahiri",
];

const REVIEW_POOLS: Record<string, { texts: string[]; ratingFn: () => number }> = {
  super_positive: {
    texts: [
      "Absolutely mind-blowing product! The quality is on another level entirely. Best purchase I've made this year!",
      "Five stars without hesitation! The craftsmanship is impeccable and it feels truly premium.",
      "I'm blown away by the quality. This is exactly what premium means. Worth every single rupee!",
      "Outstanding in every way! From packaging to the product itself, everything screams quality.",
      "This is a masterpiece! I've tried many brands but nothing comes close to this level of quality.",
      "Couldn't be happier! The product exceeded every expectation I had. Truly world-class.",
      "Superb quality and attention to detail. I'm recommending this to everyone I know!",
      "Perfect in every sense. The material, the finish, the comfort — everything is top-notch.",
      "This product changed my experience completely. Absolutely worth the investment!",
      "Incredible quality! I was skeptical at first but now I'm a customer for life.",
      "The best product in its category, hands down. No competition at this price point.",
      "I bought this as a gift and was so impressed I ordered one for myself too!",
      "Premium quality that you can actually feel. This brand truly cares about their customers.",
      "Exceeded all my expectations! The attention to detail is remarkable and the quality is unmatched.",
      "I've been a loyal customer for a reason — they never miss. Another perfect product!",
    ],
    ratingFn: () => pick([5, 5, 5, 5, 5, 5, 4]),
  },
  positive: {
    texts: [
      "Great product! The quality is impressive and it works exactly as described.",
      "Very happy with this purchase. Good value for money and fast delivery.",
      "Solid product with good build quality. Would recommend to others.",
      "Really nice product. The material feels good and the fit is perfect.",
      "Happy with my order. It looks great and functions well too.",
      "Good quality for the price. Does everything I expected and more.",
      "Pleasantly surprised by the quality. Much better than similar products I've tried.",
      "The product is well-made and arrived quickly. Very satisfied overall.",
      "Nice design and good quality. Would buy from this brand again.",
      "Does what it promises. Good quality at a reasonable price.",
      "Impressed with the build quality. It feels durable and looks premium.",
      "Very good product overall. Minor improvements possible but still great.",
      "Exceeded my expectations for this price range. Highly recommend!",
      "Solid purchase. The quality is there and the delivery was on time.",
      "Good product, good price. No complaints at all!",
    ],
    ratingFn: () => pick([5, 5, 4, 4, 4]),
  },
  negative: {
    texts: [
      "Average product. The quality is okay but nothing special for the price.",
      "Expected a bit more for the money. The product is decent but not great.",
      "It's fine for basic use. Don't expect premium quality at this price.",
      "The product works but the quality could be better. Some rough edges.",
      "Decent but not outstanding. There are better options available.",
      "It's okay. Not bad but not amazing either. Gets the job done.",
      "Quality is average. The product looks good but feels a bit cheap.",
      "Not bad, not great. Somewhere in the middle. Expected a little more.",
      "The product is usable but I've seen better quality for similar prices.",
      "Mixed feelings. Some aspects are good, others need improvement.",
    ],
    ratingFn: () => pick([3, 3, 3, 2, 2]),
  },
  bad: {
    texts: [
      "Disappointed with the quality. Expected much better for this price.",
      "The product doesn't match the description. Quality is below expectations.",
      "Not satisfied with this purchase. The material feels cheap and flimsy.",
      "Would not recommend. The quality is poor and it broke within a week.",
      "Very disappointed. The product looks nothing like the photos.",
      "Poor quality for the price. There are much better options out there.",
      "The product arrived damaged and the quality is subpar. Not happy.",
      "Regret this purchase. The build quality is really bad.",
      "Save your money. This product is not worth the price at all.",
      "One of the worst purchases I've made. Would give zero stars if I could.",
    ],
    ratingFn: () => pick([2, 2, 1, 1, 1]),
  },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type ReviewType = keyof typeof REVIEW_POOLS;

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const productId = String(body.productId || "");
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 20);
    const reviewType: ReviewType = body.reviewType || "positive";

    if (!REVIEW_POOLS[reviewType]) {
      return NextResponse.json({ success: false, message: "Invalid review type." }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ success: false, message: "Product ID is required." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    let botUser = await prisma.user.findFirst({
      where: { email: "bot@shopsphere.system" },
      select: { id: true },
    });

    if (!botUser) {
      botUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: "Review System",
          email: "bot@shopsphere.system",
          password: crypto.randomUUID(),
          role: "CUSTOMER",
        },
        select: { id: true },
      });
    }

    const pool = REVIEW_POOLS[reviewType];
    const reviews = [];

    for (let i = 0; i < count; i++) {
      const firstName = pick(INDIAN_FIRST_NAMES);
      const lastName = pick(INDIAN_LAST_NAMES);
      const displayName = `${firstName} ${lastName}`;
      const rating = pool.ratingFn();
      const comment = pick(pool.texts);

      const daysAgo = Math.floor(Math.random() * 60) + 1;
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));

      const review = await prisma.review.create({
        data: {
          productId,
          userId: botUser.id,
          rating,
          comment,
          verified: reviewType === "super_positive" || (reviewType === "positive" && Math.random() > 0.3),
          isBot: true,
          displayName,
          createdAt,
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      });

      reviews.push({ ...review, displayName });
    }

    return NextResponse.json({
      success: true,
      message: `${reviews.length} ${reviewType.replace("_", " ")} reviews generated for "${product.name}".`,
      reviews,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
