const nodemailer = require('nodemailer');

// Create SendPulse SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-pulse.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.SENDPULSE_SMTP_USER,
    pass: process.env.SENDPULSE_SMTP_PASS
  }
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('SendPulse SMTP connection error:', error.message);
  } else {
    console.log('SendPulse SMTP ready to send emails');
  }
});

// Send email using SendPulse SMTP
const sendEmail = async (to, subject, htmlBody) => {
  const mailOptions = {
    from: `Ultra Creators <${process.env.EMAIL_FROM}>`,
    to: to,
    subject: subject,
    html: htmlBody
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${to} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send email verification
exports.sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/home?token=${verificationToken}`;

  const message = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Montserrat', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #d4af37;
        }
        .brand {
          font-size: 28px;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 0.2em;
        }
        .content {
          padding: 40px 20px;
          background-color: #111111;
          border-radius: 12px;
          margin: 30px 0;
        }
        h1 {
          color: #d4af37;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          line-height: 1.6;
          color: #c7c7c7;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #d4af37, #b89418);
          color: #000000;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 20px 0;
        }
        .warning {
          background-color: #2a1a00;
          border-left: 4px solid #d4af37;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #9a9a9a;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">ULTRA CREATORS</div>
        </div>

        <div class="content">
          <h1>Bem-vindo(a), ${user.nome}!</h1>

          <p>Obrigado por se cadastrar na <strong>Ultra Creators</strong>!</p>

          <p>Para ativar sua conta e comecar a lucrar com o <strong>Metodo Ultra Milionario</strong>, voce precisa verificar seu endereco de email.</p>

          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verificar Minha Conta</a>
          </p>

          <p style="text-align: center; color: #9a9a9a; font-size: 14px;">
            Ou copie e cole o link abaixo no seu navegador:
          </p>

          <p style="word-break: break-all; background-color: #181818; padding: 15px; border-radius: 8px; font-size: 12px;">
            ${verificationUrl}
          </p>

          <div class="warning">
            <p style="margin: 0; font-size: 14px;">
              Este link e valido por <strong>24 horas</strong>. Se voce nao solicitou este cadastro, ignore este email.
            </p>
          </div>

          <p>Apos a verificacao, voce tera acesso completo a:</p>
          <ul style="color: #c7c7c7;">
            <li>Treinamento 100% gratuito</li>
            <li>Materiais e criativos profissionais</li>
            <li>Suporte dedicado</li>
            <li>Comunidade premium de afiliados</li>
          </ul>

          <p style="margin-top: 30px;">Estamos ansiosos para te-lo(a) conosco!</p>

          <p style="color: #d4af37; font-weight: 600;">
            Equipe Ultra Creators<br>
            Metodo Ultra Milionario
          </p>
        </div>

        <div class="footer">
          <p>Ultra Creators 2025 | Todos os direitos reservados</p>
          <p>contato@ultracreators.com.br</p>
          <p style="margin-top: 10px; font-size: 11px;">
            Este e um email automatico. Por favor, nao responda a esta mensagem.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail(user.email, "Verifique seu email - Ultra Creators", message);
    console.log(`Email de verificacao enviado para: ${user.email}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw new Error("Erro ao enviar email de verificacao");
  }
};

// Send welcome email after verification
exports.sendWelcomeEmail = async (user) => {
  const message = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Montserrat', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #d4af37;
        }
        .brand {
          font-size: 28px;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 0.2em;
        }
        .content {
          padding: 40px 20px;
          background-color: #111111;
          border-radius: 12px;
          margin: 30px 0;
        }
        h1 {
          color: #d4af37;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          line-height: 1.6;
          color: #c7c7c7;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #d4af37, #b89418);
          color: #000000;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #9a9a9a;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">ULTRA CREATORS</div>
        </div>

        <div class="content">
          <h1>Conta Verificada com Sucesso!</h1>

          <p>Ola, <strong>${user.nome}</strong>!</p>

          <p>Sua conta foi verificada com sucesso! Agora voce faz parte da maior plataforma de afiliados premium do Brasil.</p>

          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/users" class="button">Acessar Minha Conta</a>
          </p>

          <p>Proximos passos:</p>
          <ol style="color: #c7c7c7;">
            <li>Acesse sua conta</li>
            <li>Complete seu perfil</li>
            <li>Explore o treinamento gratuito</li>
            <li>Baixe os materiais prontos</li>
            <li>Comece a promover e lucrar!</li>
          </ol>

          <p style="margin-top: 30px;">Lembre-se: estamos aqui para ajuda-lo(a) em cada etapa da jornada!</p>

          <p style="color: #d4af37; font-weight: 600;">
            Equipe Ultra Creators<br>
            Metodo Ultra Milionario
          </p>
        </div>

        <div class="footer">
          <p>Ultra Creators 2025 | Todos os direitos reservados</p>
          <p>contato@ultracreators.com.br</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail(user.email, "Bem-vindo a Ultra Creators!", message);
    console.log(`Email de boas-vindas enviado para: ${user.email}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email de boas-vindas:", error);
    return false;
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/home?reset-token=${resetToken}`;

  const message = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Montserrat', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #d4af37;
        }
        .brand {
          font-size: 28px;
          font-weight: 700;
          color: #d4af37;
          letter-spacing: 0.2em;
        }
        .content {
          padding: 40px 20px;
          background-color: #111111;
          border-radius: 12px;
          margin: 30px 0;
        }
        h1 {
          color: #d4af37;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          line-height: 1.6;
          color: #c7c7c7;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #d4af37, #b89418);
          color: #000000;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 20px 0;
        }
        .warning {
          background-color: #2a1a00;
          border-left: 4px solid #d4af37;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #9a9a9a;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">ULTRA CREATORS</div>
        </div>

        <div class="content">
          <h1>Redefinir Senha</h1>

          <p>Ola, <strong>${user.nome}</strong>!</p>

          <p>Voce solicitou a redefinicao de senha da sua conta Ultra Creators.</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
          </p>

          <p style="text-align: center; color: #9a9a9a; font-size: 14px;">
            Ou copie e cole o link abaixo no seu navegador:
          </p>

          <p style="word-break: break-all; background-color: #181818; padding: 15px; border-radius: 8px; font-size: 12px;">
            ${resetUrl}
          </p>

          <div class="warning">
            <p style="margin: 0; font-size: 14px;">
              Este link e valido por <strong>1 hora</strong>. Se voce nao solicitou esta redefinicao, ignore este email e sua senha permanecera inalterada.
            </p>
          </div>

          <p style="color: #d4af37; font-weight: 600;">
            Equipe Ultra Creators
          </p>
        </div>

        <div class="footer">
          <p>Ultra Creators 2025 | Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail(user.email, "Redefinir Senha - Ultra Creators", message);
    console.log(`Email de redefinicao de senha enviado para: ${user.email}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email de redefinicao:", error);
    throw new Error("Erro ao enviar email de redefinicao de senha");
  }
};

// Send support email
exports.sendSupportEmail = async (userName, userEmail, subject, message) => {
  const supportEmail = process.env.EMAIL_FROM || 'support@ultracreators.com.br';

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Montserrat', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          padding-bottom: 30px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }
        .logo {
          font-size: 28px;
          font-weight: 700;
          color: #D4AF37;
          letter-spacing: 3px;
        }
        .content {
          padding: 30px 0;
        }
        .label {
          color: #D4AF37;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .value {
          color: #ffffff;
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(212, 175, 55, 0.1);
          border-radius: 8px;
          border-left: 3px solid #D4AF37;
        }
        .message-box {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 8px;
          white-space: pre-wrap;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          padding-top: 30px;
          border-top: 1px solid rgba(212, 175, 55, 0.3);
          color: #888;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ULTRA CREATORS</div>
          <p style="color: #888; margin-top: 10px;">Nova Mensagem de Suporte</p>
        </div>

        <div class="content">
          <p class="label">De:</p>
          <div class="value">${userName} (${userEmail})</div>

          <p class="label">Assunto:</p>
          <div class="value">${subject}</div>

          <p class="label">Mensagem:</p>
          <div class="message-box">${message}</div>
        </div>

        <div class="footer">
          <p>Esta mensagem foi enviada atraves do sistema de suporte Ultra Creators.</p>
          <p>Responda diretamente para: ${userEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(supportEmail, `[Suporte] ${subject}`, htmlBody);
  console.log("Email de suporte enviado de: " + userEmail);
};
