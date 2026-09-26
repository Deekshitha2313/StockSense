import { OTP_EXPIRY_MINUTES } from './constants';

export class OtpGenerator {
  /**
   * Generates a secure, numerical one-time password of specified digits
   */
  static generateOtp(digits = 6): string {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Calculates OTP expiry timestamp
   */
  static getExpiryDate(minutes = OTP_EXPIRY_MINUTES): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * Validates OTP match and expiration
   */
  static validate(
    inputCode: string,
    storedCode: string | null | undefined,
    expiresAt: Date | null | undefined
  ): { isValid: boolean; error?: string } {
    if (!storedCode || !expiresAt) {
      return { isValid: false, error: 'No active OTP verification code found' };
    }

    if (new Date() > expiresAt) {
      return { isValid: false, error: 'OTP code has expired. Please request a new code.' };
    }

    if (inputCode.trim() !== storedCode.trim()) {
      return { isValid: false, error: 'Invalid OTP code. Please try again.' };
    }

    return { isValid: true };
  }
}
