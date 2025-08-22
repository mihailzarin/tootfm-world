const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    console.error('💡 Please check your .env file');
    return;
  }
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📈 Users in database: ${userCount}`);

    // Test schema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Available tables:', tables.map(t => t.table_name));

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'P1001') {
      console.error('💡 This usually means:');
      console.error('   - Database server is not running');
      console.error('   - DATABASE_URL is incorrect');
      console.error('   - Network connectivity issues');
    } else if (error.code === 'P1002') {
      console.error('💡 This usually means:');
      console.error('   - Database server is overloaded');
      console.error('   - Connection pool is full');
    } else if (error.code === 'P1008') {
      console.error('💡 This usually means:');
      console.error('   - Database operations timed out');
    } else if (error.code === 'P1017') {
      console.error('💡 This usually means:');
      console.error('   - Database server closed the connection');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('🏁 Database test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });