const { body } = require('express-validator');
const User = require('../models/User');
const OTP = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const generateOTP = require('../utils/generateOTP');
const { sendOTPSMS } = require('../utils/sendSMS');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// @desc    Register with email & password
// @route   POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id, user.role);

    // Send welcome email (non-blocking)
    const tmpl = emailTemplates.welcomeEmail(user);
    sendEmail({ to: email, ...tmpl }).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login with email & password
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, mobile: user.mobile },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to mobile
// @route   POST /api/auth/send-otp
const sendOTP = async (req, res, next) => {
  try {
    const { mobile, purpose = 'login' } = req.body;

    // Invalidate all previous OTPs for this mobile & purpose
    await OTP.deleteMany({ mobile, purpose });

    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await OTP.create({ mobile, otp, purpose, expiresAt });

    const result = await sendOTPSMS(mobile, otp);

    if (result.mock) {
      console.log(`🔐 OTP for ${mobile}: ${otp}`);
    }

    res.json({
      success: true,
      message: `OTP sent to ${mobile}`,
      ...(process.env.NODE_ENV === 'development' && { otp }), // Expose in dev only
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and login/signup
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
  try {
    const { mobile, otp, name, purpose = 'login' } = req.body;

    const otpRecord = await OTP.findOne({ mobile, purpose, isUsed: false });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found or already used' });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Request a new OTP.' });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Find or create user
    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({
        name: name || `User${mobile.slice(-4)}`,
        mobile,
        isMobileVerified: true,
      });
    } else {
      user.isMobileVerified = true;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, mobile, addresses } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (addresses) user.addresses = addresses;

    await user.save();

    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'No password set. Use OTP login.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, sendOTP, verifyOTP, getMe, updateProfile, changePassword };
