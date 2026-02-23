import nodemailer from 'nodemailer';
import { BrevoClient } from '@getbrevo/brevo';

const ENVIRONMENT = process.env.ENVIRONMENT

export const sendMail = async (body) => {
  const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
  });

  await brevo.transactionalEmails.sendTransacEmail({
    subject: "Batelec Advisory",
    htmlContent : body,
    sender : { "name": "App Mailer", "email": "app.mailer019@gmail.com" },
    to : [{ "email": "trinidadpatrick019@gmail.com", "name": "New User" }]
  }).then(console.log).catch(console.error);

  // const transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS,
  //   },
  //   port: 465,
  //   secure: ENVIRONMENT === 'LOCAL' ? false : true
  // });

  // const mailOptions = {
  //   from: 'app.mailer@gmail.com',
  //   to: 'trinidadpatrick019@gmail.com',
  //   subject: 'Batelec Advisory',
  //   html: `<main>${body}<main>`
  // };

  // try {
  //   const send = await transporter.sendMail(mailOptions)
  //   return send
  // } catch (error) {
  //   return error
  // }

}