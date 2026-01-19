require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.message.deleteMany();

  // Create test messages
  await prisma.message.createMany({
    data: [
      {
        senderEmail: 'alice@example.com',
        senderName: 'Alice Johnson',
        subject: 'Hello from Alice!',
        rawBody: `Hey everyone! Just wanted to say hi and let you know the project is going great. Looking forward to seeing you all soon!

--
Alice Johnson
Software Engineer
Sent from my iPhone`,
        cleanedBody: 'Hey everyone! Just wanted to say hi and let you know the project is going great. Looking forward to seeing you all soon!',
        vestaboardText: `HEY EVERYONE! JUST
WANTED TO SAY HI AND
LET YOU KNOW THE
PROJECT IS GOING
GREAT!
`,
        status: 'pending',
        messageId: 'msg-001'
      },
      {
        senderEmail: 'bob@company.org',
        senderName: 'Bob Smith',
        subject: 'Team lunch Friday',
        rawBody: "Don't forget - team lunch this Friday at noon! See you there.",
        cleanedBody: "Don't forget - team lunch this Friday at noon! See you there.",
        vestaboardText: `DON'T FORGET - TEAM
LUNCH THIS FRIDAY AT
NOON! SEE YOU THERE.


`,
        status: 'pending',
        messageId: 'msg-002'
      },
      {
        senderEmail: 'carol@mail.com',
        senderName: null,
        subject: 'Quick note',
        rawBody: 'The coffee machine is fixed!',
        cleanedBody: 'The coffee machine is fixed!',
        vestaboardText: `THE COFFEE MACHINE IS
FIXED!



`,
        status: 'pending',
        messageId: 'msg-003'
      },
      {
        senderEmail: 'dave@example.com',
        senderName: 'Dave Wilson',
        subject: 'Happy Monday!',
        rawBody: 'Hope everyone has a great week ahead!',
        cleanedBody: 'Hope everyone has a great week ahead!',
        vestaboardText: `HOPE EVERYONE HAS A
GREAT WEEK AHEAD!



`,
        status: 'posted',
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        messageId: 'msg-004'
      },
      {
        senderEmail: 'eve@test.com',
        senderName: 'Eve Adams',
        subject: 'Congrats team!',
        rawBody: 'We hit our Q4 goals! Amazing work everyone!',
        cleanedBody: 'We hit our Q4 goals! Amazing work everyone!',
        vestaboardText: `WE HIT OUR Q4 GOALS!
AMAZING WORK EVERYONE!



`,
        status: 'posted',
        postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        messageId: 'msg-005'
      },
      {
        senderEmail: 'frank@spam.com',
        senderName: null,
        subject: 'Buy now!!!',
        rawBody: 'AMAZING DEAL CLICK HERE NOW!!!',
        cleanedBody: 'AMAZING DEAL CLICK HERE NOW!!!',
        vestaboardText: `AMAZING DEAL CLICK
HERE NOW!!!



`,
        status: 'rejected',
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        messageId: 'msg-006'
      }
    ]
  });

  console.log('Seeded 6 test messages');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
