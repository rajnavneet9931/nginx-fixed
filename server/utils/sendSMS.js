/**
 * SMS / OTP Utility
 * Uses Twilio if credentials are set, otherwise uses mock logging.
 */

const sendSMS = async ({ to, message }) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      // Mock SMS - log to console for development
      console.log(`📱 [MOCK SMS] To: ${to} | Message: ${message}`);
      return { success: true, mock: true };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to.startsWith('+') ? to : `+91${to}`,
    });

    console.log(`📱 SMS sent to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ SMS send error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendOTPSMS = async (mobile, otp) => {
  const message = `Your BareSober verification code is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`;
  return sendSMS({ to: mobile, message });
};

module.exports = { sendSMS, sendOTPSMS };
