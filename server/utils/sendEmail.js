const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 [MOCK EMAIL] To:', to, '| Subject:', subject);
      console.log('📧 [MOCK EMAIL] Body:', text || 'HTML email');
      return { success: true, mock: true };
    }

    const transporter = createTransporter();
    const result = await transporter.sendMail({
      from: `"BareSober" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`📧 Email sent to ${to}: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  orderConfirmation: (order) => ({
    subject: `Order Confirmed - ${order.orderNumber} | BareSober`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #d4af7a; margin: 0; font-size: 24px;">BareSober</h1>
          <p style="color: #fff; margin: 5px 0 0;">Premium Skincare</p>
        </div>
        <div style="background: #fff; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a1a;">Order Confirmed! 🎉</h2>
          <p>Thank you for your order. Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
          </div>
          <p>We will notify you when your order is shipped.</p>
          <p style="color: #888; font-size: 12px;">© 2024 BareSober. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  stockNotification: (product, email) => ({
    subject: `${product.name} is Back in Stock! | BareSober`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
        <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #d4af7a; margin: 0;">BareSober</h1>
        </div>
        <div style="background: #fff; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2>Great News! 🎊</h2>
          <p><strong>${product.name}</strong> is now back in stock!</p>
          <p>Hurry, limited stock available. Shop before it runs out again.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/product-detail.html?id=${product._id}" 
             style="display: inline-block; background: #d4af7a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
            Shop Now
          </a>
        </div>
      </div>
    `,
  }),

  welcomeEmail: (user) => ({
    subject: 'Welcome to BareSober! ✨',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a1a; padding: 20px; text-align: center;">
          <h1 style="color: #d4af7a; margin: 0;">BareSober</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Welcome, ${user.name}! 🌿</h2>
          <p>Thank you for joining the BareSober family. Explore our premium skincare collection crafted for your skin's best health.</p>
          <p>Your journey to radiant skin starts here.</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
