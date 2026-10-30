import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { ENV } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'operator', 'viewer']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  });
};

export const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password, role = 'operator' } = registerSchema.parse(req.body);

      const existing = await User.findOne({ email });
      if (existing) {
        return sendError(res, 'An account with this email address already exists.', 409);
      }

      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        name,
        email,
        passwordHash,
        role,
        status: 'active'
      });

      const token = generateToken(user._id, user.role);

      await AuditLog.create({
        actor: user.email,
        actorId: user._id,
        action: 'USER_REGISTERED',
        resourceType: 'User',
        resourceId: user._id.toString(),
        details: { role: user.role }
      });

      return sendSuccess(res, {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }, 'Registration successful', 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await User.findOne({ email });
      if (!user) {
        return sendError(res, 'Invalid email or password credentials.', 401);
      }

      if (user.status !== 'active') {
        return sendError(res, 'Account is inactive or suspended. Contact administrator.', 403);
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return sendError(res, 'Invalid email or password credentials.', 401);
      }

      user.lastLoginAt = new Date();
      await user.save();

      const token = generateToken(user._id, user.role);

      return sendSuccess(res, {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res) {
    return sendSuccess(res, {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        lastLoginAt: req.user.lastLoginAt
      }
    });
  },

  async logout(req, res) {
    return sendSuccess(res, null, 'Logged out successfully');
  }
};
