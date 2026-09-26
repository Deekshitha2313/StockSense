import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { UserSession } from '@/types';
import { validateEmail, validatePassword } from '@/lib/validators';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'stocksense-super-secure-production-modular-jwt-key-2026'
);

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async createToken(session: UserSession): Promise<string> {
    return new SignJWT({ ...session })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
  }

  static async verifyToken(token: string): Promise<UserSession | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return {
        id: payload.id as string,
        name: payload.name as string,
        email: payload.email as string,
        role: payload.role as Role,
      };
    } catch {
      return null;
    }
  }

  static async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: UserSession; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const isMatch = await this.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Invalid email or password' };
    }

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = await this.createToken(session);
    return { success: true, token, user: session };
  }

  static async register(name: string, email: string, password: string, role: Role = Role.STAFF): Promise<{ success: boolean; token?: string; user?: UserSession; error?: string }> {
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' };
    }

    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      return { success: false, error: passCheck.message || 'Invalid password' };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const passwordHash = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
      },
    });

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = await this.createToken(session);
    return { success: true, token, user: session };
  }

  static async requestOtp(email: string): Promise<{ success: boolean; otp?: string; error?: string }> {
    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return { success: true, otp: '123456' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiresAt: expiresAt,
      },
    });

    return { success: true, otp };
  }

  static async resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    if (new Date() > user.otpExpiresAt) {
      return { success: false, error: 'OTP has expired. Please request a new code.' };
    }

    if (user.otpCode !== otp.trim()) {
      return { success: false, error: 'Incorrect OTP code entered' };
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.isValid) {
      return { success: false, error: passCheck.message };
    }

    const passwordHash = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return { success: true };
  }
}
