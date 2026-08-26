import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const operators = ["Airtel", "Jio", "Vi", "BSNL"];

  for (const name of operators) {
    await prisma.operator.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  await prisma.user.upsert({
    where: { email: "dev@paytm-recharge.local" },
    update: {},
    create: {
      name: "Development User",
      email: "dev@paytm-recharge.local",
      phone: "9999999999",
    },
  });

  console.log("Operators and development user seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });