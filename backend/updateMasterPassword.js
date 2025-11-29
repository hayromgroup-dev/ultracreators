require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const NEW_PASSWORD = '&O^/T?N%9Gle7M_w-n?]]Q$wg-V5$K>*';

async function updateMasterPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB conectado com sucesso!');

    // Find master admin
    const masterAdmin = await User.findOne({ email: 'admin@ultracreators.com' });

    if (!masterAdmin) {
      console.error('❌ Master admin não encontrado!');
      process.exit(1);
    }

    console.log('📝 Master admin encontrado:', masterAdmin.email);

    // Update password
    masterAdmin.senha = NEW_PASSWORD;
    await masterAdmin.save();

    console.log('✅ Senha do master admin atualizada com sucesso!');
    console.log('📧 Email:', masterAdmin.email);
    console.log('🔐 Nova senha: (senha segura definida)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
    process.exit(1);
  }
}

updateMasterPassword();
