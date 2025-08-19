const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected! Users: ${userCount}`);
    
    // Test creating a user
    const testUser = await prisma.user.create({
      data: {
        worldId: 'test_world_id_' + Date.now(),
        primaryId: 'usr_test_' + Date.now(),
        displayName: 'Test User',
        level: 'guest'
      }
    });
    
    console.log('✅ Test user created:', testUser.displayName);
    console.log('   primaryId:', testUser.primaryId);
    console.log('   level:', testUser.level);
    
    // Clean up
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    
    console.log('✅ Test user deleted. Database is ready!');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
