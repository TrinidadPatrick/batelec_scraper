const nodemailer = require('nodemailer')

module.exports.sendMail = async (body) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      });

      const mailOptions = {
        from: 'swaply.support@gmail.com',
        to: 'trinidadpatrick019@gmail.com',
        subject: 'Batelec Advisory',
        html: body
      };

      try {
        const send = await transporter.sendMail(mailOptions)
        return send
      } catch (error) {
        return error
      }
      
}