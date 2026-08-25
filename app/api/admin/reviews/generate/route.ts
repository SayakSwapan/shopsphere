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

const POSITIVE_REVIEWS = [
  "Absolutely love this product! The quality is outstanding and it exceeded my expectations.",
  "Great value for money. The build quality is impressive and it works perfectly.",
  "Superb product! Delivered on time and the packaging was excellent.",
  "Very happy with this purchase. The material quality is top-notch.",
  "Excellent product, highly recommended! The finish and detailing are remarkable.",
  "This is exactly what I was looking for. Perfect fit and great comfort.",
  "Amazing quality! Better than what I expected at this price point.",
  "Very satisfied with the product. It looks even better in person.",
  "Perfect purchase! The product matches the description exactly.",
  "Outstanding quality and fast delivery. Will definitely buy again.",
  "Impressed with the craftsmanship. You can feel the quality immediately.",
  "Five stars! This product is worth every penny spent.",
  "My whole family loved it. Great quality and beautiful design.",
  "The product exceeded all my expectations. Truly premium quality.",
  "Been using it for a week now and very happy with the performance.",
  "Best product in this category. I compared many before choosing this one.",
  "The material feels premium and the stitching is perfect. Highly recommend.",
  "Solid product with great attention to detail. Very happy customer here.",
  "Received it quickly and it was exactly as described. Very pleased.",
  "This brand never disappoints. Another excellent product from them.",
];

const MEDIUM_REVIEWS = [
  "Good product overall. Minor issues but nothing major.",
  "Decent quality for the price. Does what it's supposed to do.",
  "It's okay. Expected a little better but still acceptable.",
  "Pretty good product. The delivery was fast which was a plus.",
  "Satisfactory product. Works fine for everyday use.",
  "Average product. Nothing extraordinary but gets the job done.",
  "Nice product for the price range. Could be slightly better.",
  "It's a good buy. Not perfect but definitely worth considering.",
];

const LOW_REVIEWS = [
  "Could be better. The quality doesn't fully match the price.",
  "Average product. Expected more at this price point.",
  "It's fine but not great. There's room for improvement.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRating(): number {
  const weights = [5, 5, 4, 4, 4, 3, 3, 2, 1];
  return pick(weights);
}

function generateReviewText(rating: number): string {
  if (rating >= 4) return pick(POSITIVE_REVIEWS);
  if (rating === 3) return pick(MEDIUM_REVIEWS);
  return pick(LOW_REVIEWS);
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const productId = String(body.productId || "");
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 20);

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

    const reviews = [];
    for (let i = 0; i < count; i++) {
      const firstName = pick(INDIAN_FIRST_NAMES);
      const lastName = pick(INDIAN_LAST_NAMES);
      const displayName = `${firstName} ${lastName.charAt(0)}.`;
      const rating = generateRating();
      const comment = generateReviewText(rating);

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
          verified: Math.random() > 0.3,
          isBot: true,
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
      message: `${reviews.length} bot reviews generated for "${product.name}".`,
      reviews,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
