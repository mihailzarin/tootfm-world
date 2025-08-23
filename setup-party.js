const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupEverything() {
  console.log('🚀 Настраиваем всё автоматически...\n');
  
  try {
    // 1. Находим твоего пользователя
    const user = await prisma.user.findFirst({
      where: { 
        email: { contains: '@' } 
      },
      include: {
        musicProfile: true
      }
    });
    
    if (!user) {
      console.log('❌ Пользователь не найден. Сначала войди через Google!');
      return;
    }
    
    console.log(`✅ Нашли пользователя: ${user.name || user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Музыкальный профиль: ${user.musicProfile ? 'ЕСТЬ' : 'НЕТ'}`);
    
    // 2. Создаём новую party
    const partyCode = 'DEMO' + Math.floor(Math.random() * 100);
    
    const party = await prisma.party.create({
      data: {
        code: partyCode,
        name: 'Test Music Party 🎵',
        description: 'Тестируем генерацию плейлистов',
        creatorId: user.id,
        isActive: true,
        maxMembers: 50,
        votingEnabled: false,
        partyRadio: false
      }
    });
    
    console.log(`\n✅ Создали party: ${party.name}`);
    console.log(`   Код: ${party.code}`);
    
    // 3. Добавляем тебя как участника
    await prisma.partyMember.create({
      data: {
        partyId: party.id,
        userId: user.id,
        role: 'HOST'
      }
    });
    
    console.log('✅ Добавили тебя как HOST\n');
    
    // 4. Проверяем что всё готово
    if (user.musicProfile && user.musicProfile.unifiedTopTracks) {
      console.log('🎉 ВСЁ ГОТОВО!');
      console.log('📍 Открой в браузере:');
      console.log(`   http://localhost:3000/party/${party.code}`);
      console.log('\n💡 На странице party нажми "Generate Playlist"');
    } else {
      console.log('⚠️  У тебя нет музыкального профиля!');
      console.log('📍 Что делать:');
      console.log('   1. Открой http://localhost:3000/profile');
      console.log('   2. Нажми "Analyze Music" или "Refresh"');
      console.log('   3. Потом возвращайся на страницу party');
      console.log(`\n📍 Ссылка на party:`);
      console.log(`   http://localhost:3000/party/${party.code}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.message.includes('Unique constraint')) {
      console.log('\n💡 Попробуй запустить скрипт ещё раз');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupEverything();
