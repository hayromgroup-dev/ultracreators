require('dotenv').config();
const mongoose = require('mongoose');
const Achievement = require('./models/Achievement');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((error) => {
    console.error('❌ Erro ao conectar:', error);
    process.exit(1);
  });

async function seedAchievements() {
  try {
    const admin = await User.findOne({ isAdmin: true });
    if (!admin) {
      console.error('❌ Nenhum usuário admin encontrado.');
      process.exit(1);
    }

    console.log(`📝 Usando admin: ${admin.nome} (${admin.email})`);

    const defaultAchievements = [
      {
        name: 'Primeira Aula',
        description: 'Complete sua primeira aula e dê o primeiro passo rumo ao sucesso!',
        icon: '🎯',
        conditionType: 'first_lesson',
        conditionValue: 1,
        order: 0,
        createdBy: admin._id
      },
      {
        name: 'Estudante Dedicado',
        description: 'Complete 5 aulas e mostre sua dedicação aos estudos.',
        icon: '📚',
        conditionType: 'lessons_completed',
        conditionValue: 5,
        order: 1,
        createdBy: admin._id
      },
      {
        name: 'Entusiasta do Conhecimento',
        description: 'Complete 10 aulas e prove que está comprometido com seu aprendizado.',
        icon: '🔥',
        conditionType: 'lessons_completed',
        conditionValue: 10,
        order: 2,
        createdBy: admin._id
      },
      {
        name: 'Mestre em Formação',
        description: 'Complete 25 aulas e demonstre sua paixão por aprender.',
        icon: '⚡',
        conditionType: 'lessons_completed',
        conditionValue: 25,
        order: 3,
        createdBy: admin._id
      },
      {
        name: 'Primeiro Curso Completo',
        description: 'Finalize seu primeiro curso completo e celebre esta conquista!',
        icon: '🎓',
        conditionType: 'first_course',
        conditionValue: 1,
        order: 4,
        createdBy: admin._id
      },
      {
        name: 'Campeão do Aprendizado',
        description: 'Complete 3 cursos e torne-se um verdadeiro campeão!',
        icon: '🏆',
        conditionType: 'course_completed',
        conditionValue: 3,
        order: 5,
        createdBy: admin._id
      },
      {
        name: 'Ultra Creator Elite',
        description: 'Complete 5 cursos e junte-se à elite dos Ultra Creators!',
        icon: '👑',
        conditionType: 'course_completed',
        conditionValue: 5,
        order: 6,
        createdBy: admin._id
      },
      {
        name: 'Constância é a Chave',
        description: 'Acesse a plataforma por 7 dias seguidos.',
        icon: '📅',
        conditionType: 'streak_days',
        conditionValue: 7,
        order: 7,
        createdBy: admin._id
      },
      {
        name: 'Compromisso Total',
        description: 'Acesse a plataforma por 30 dias seguidos e mostre seu compromisso!',
        icon: '🔒',
        conditionType: 'streak_days',
        conditionValue: 30,
        order: 8,
        createdBy: admin._id
      }
    ];

    const existingCount = await Achievement.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Já existem ${existingCount} conquistas no banco de dados.`);
      console.log('Para substituir, execute: node seedAchievements.js --force');

      if (!process.argv.includes('--force')) {
        console.log('❌ Operação cancelada.');
        process.exit(0);
      }

      console.log('🗑️  Removendo conquistas existentes...');
      await Achievement.deleteMany({});
    }

    console.log('📝 Criando conquistas padrão...');
    const created = await Achievement.insertMany(defaultAchievements);

    console.log(`✅ ${created.length} conquistas criadas com sucesso!`);
    console.log('\n📋 Conquistas criadas:');
    created.forEach((achievement, index) => {
      console.log(`${index + 1}. ${achievement.icon} ${achievement.name}`);
    });

    console.log('\n✅ Seed concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar conquistas:', error);
    process.exit(1);
  }
}

seedAchievements();
