import nodemailer from 'nodemailer';

(async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'tonemail@gmail.com',
      pass: 'leMotDePasseDApplicationSansEspace',
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"Test Mailer" <tonemail@gmail.com>',
      to: 'uneautreadresse@gmail.com',
      subject: 'Test ✔',
      text: 'Ceci est un test simple depuis Nodemailer',
    });
    console.log('Message envoyé: %s', info.messageId);
  } catch (err) {
    console.error('Erreur:', err);
  }
})();
