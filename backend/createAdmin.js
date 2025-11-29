require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    // Admin user details
    const adminEmail = 'admin@ultracreators.com';
    const adminPassword = 'admin123456'; // Change this!

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      // Update existing user to be admin
      admin.isAdmin = true;
      admin.isEmailVerified = true;
      admin.isActive = true;
      await admin.save();
      console.log('✅ Usuário atualizado para administrador!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Senha: (mantida a mesma)`);
    } else {
      // Create new admin user
      admin = await User.create({
        nome: 'Admin',
        sobrenome: 'Ultra Creators',
        email: adminEmail,
        senha: adminPassword,
        celular: '(77) 98162-1007',
        isAdmin: true,
        isEmailVerified: true,
        isActive: true
      });
      console.log('✅ Administrador criado com sucesso!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Senha: ${adminPassword}`);
      console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
};

createAdmin();
