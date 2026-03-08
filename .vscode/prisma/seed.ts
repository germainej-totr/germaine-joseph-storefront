import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Maison Data Seed ---');

  const seedData = [
    {
      email: 'alex.vanderbilt@example.com',
      jacketSize: '52',
      trouserSize: '50',
      fitPreference: 'Slim Fit',
      appointmentTime: 'Jan 12, 10:00 AM',
      technicalSpecs: {
        attributes: {
          chest: '104',
          stomach: '96',
          waist: '90',
          hips: '106',
          notes: 'Prominent shoulder blades. Prefers soft tailoring.'
        }
      }
    },
    {
      email: 'julian.rothe@example.com',
      jacketSize: '48',
      trouserSize: '46',
      fitPreference: 'Extra Slim',
      appointmentTime: 'Jan 14, 02:30 PM',
      technicalSpecs: {
        attributes: {
          chest: '96',
          stomach: '88',
          waist: '82',
          hips: '98',
          notes: 'Sloping shoulders. Shorten sleeves by 1.5cm.'
        }
      }
    }
  ];

  for (const client of seedData) {
    await prisma.fitProfile.upsert({
      where: { email: client.email },
      update: {},
      create: client,
    });
  }

  console.log('--- Seed Complete: germaine-joseph-db is now live ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });