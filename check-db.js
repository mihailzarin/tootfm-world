const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // Проверяем количество пользователей
    const userCount = await prisma.user.count();
    console.log(`Users in database: ${userCount}`);
    
    // Проверяем музыкальные сервисы
    const serviceCount = await prisma.musicService.count();
    console.log(`Music services connected: ${serviceCount}`);
    
    // Проверяем вечеринки
    const partyCount = await prisma.party.count();
    console.log(`Parties created: ${partyCount}`);
    
    if (userCount > 0) {
      console.log('\n⚠️  Database has existing data!');
      console.log('Need to be careful with migration.');
      
      // Проверяем дубликаты serviceUserId
      const services = await prisma.musicService.findMany({
        select: { service: true, serviceUserId: true }
      });
      
      const duplicates = services.filter((s, i, arr) => 
        s.serviceUserId && arr.findIndex(x => 
          x.service === s.service && x.serviceUserId === s.serviceUserId
        ) !== i
      );
      
      if (duplicates.length > 0) {
        console.log('\n❌ Found duplicate service IDs:', duplicates);
      } else {
        console.log('✅ No duplicate service IDs found');
      }
    } else {
      console.log('\n✅ Database is empty - safe to proceed!');
    }
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
