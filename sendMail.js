const nodemailer = require('nodemailer')

const ENVIRONMENT = process.env.ENVIRONMENT

module.exports.sendMail = async (body) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        port: 465,
        secure: ENVIRONMENT === 'LOCAL' ? false : true
      });

      const mailOptions = {
        from: 'app.mailer@gmail.com',
        to: 'trinidadpatrick019@gmail.com',
        subject: 'Batelec Advisory',
        html: `<main>${body}<main>`
      };

      try {
        const send = await transporter.sendMail(mailOptions)
        return send
      } catch (error) {
        return error
      }
      
}