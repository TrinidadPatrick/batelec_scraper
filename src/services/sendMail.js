import { BrevoClient } from '@getbrevo/brevo';

export const sendMail = async (body, recipients_string) => {
  const brevoApiKey = process.env.BREVO_API_KEY

  if (typeof recipients_string !== 'string') {
    throw new Error(`Invalid recipients stated on ENV files, Please create an env file with RECIPIENTS key and value formatted like this : 
      email1@gmail.com,email2@gmail.com
      `);
  }

  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY is not defined in environment variables.");
  }

  const formattedRecipients = recipients_string.split(",").map((rec) => {
    if (!rec) {
      throw new Error('Invalid recipient format')
    }

    return {
      email: rec.trim()
    }
  })

  const brevo = new BrevoClient({
    apiKey: brevoApiKey,
  });

  const options = {
    subject: "Batelec Advisory",
    htmlContent: body,
    sender: { name: "App Mailer", email: "app.mailer019@gmail.com" },
    to: formattedRecipients
  };

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail(options);
    console.log("Email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};