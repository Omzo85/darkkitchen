import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendOrderConfirmation = async (userEmail, order, items) => {
  const itemsList = items.map(item => 
    `${item.quantity}x ${item.dish_name} (${item.price_at_time}€)`
  ).join('\n');

  const emailContent = `
    <h2>Confirmation de votre commande #${order.id}</h2>
    <p>Merci pour votre commande chez Khadija !</p>
    
    <h3>Détails de la commande :</h3>
    <pre>${itemsList}</pre>
    
    <p><strong>Total : ${order.total_amount}€</strong></p>
    
    <p>Statut : ${order.status}</p>
    
    <p>Nous vous tiendrons informé de l'avancement de votre commande.</p>
    
    <p>Merci de votre confiance !</p>
    <p>L'équipe de Chez Khadija</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `Confirmation de commande #${order.id} - Chez Khadija`,
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};