import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Note: Profiles are auto-created by the auth trigger
  // This seed adds sample data for testing

  // Sample announcements
  console.log('📢 Creating sample announcements...');

  // Sample calendar events
  console.log('📅 Creating sample calendar events...');

  // Sample gallery albums
  console.log('🖼️ Creating sample gallery albums...');

  // Sample website settings are already in supabase.sql

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
