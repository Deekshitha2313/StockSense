export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one digit' };
  }
  return { isValid: true };
}

export function validateSku(sku: string): { isValid: boolean; message?: string } {
  const cleanSku = sku.trim();
  if (cleanSku.length < 3 || cleanSku.length > 30) {
    return { isValid: false, message: 'SKU must be between 3 and 30 characters' };
  }
  if (!/^[A-Z0-9_\-\.]+$/i.test(cleanSku)) {
    return { isValid: false, message: 'SKU can only contain alphanumeric characters, hyphens, and underscores' };
  }
  return { isValid: true };
}

export function validateQuantity(qty: number | string, allowZero = false): { isValid: boolean; num: number; message?: string } {
  const num = typeof qty === 'string' ? parseFloat(qty) : qty;
  if (isNaN(num)) {
    return { isValid: false, num: 0, message: 'Quantity must be a valid number' };
  }
  if (!allowZero && num <= 0) {
    return { isValid: false, num, message: 'Quantity must be strictly greater than 0' };
  }
  if (allowZero && num < 0) {
    return { isValid: false, num, message: 'Quantity cannot be negative' };
  }
  return { isValid: true, num };
}

export function validatePrice(price: number | string): { isValid: boolean; num: number; message?: string } {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) {
    return { isValid: false, num: 0, message: 'Price must be a valid number' };
  }
  if (num < 0) {
    return { isValid: false, num, message: 'Price cannot be negative' };
  }
  return { isValid: true, num };
}
