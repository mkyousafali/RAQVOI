import bcryptjs from 'bcryptjs';

/**
 * Hash a plain text password using bcryptjs
 * @param password Plain text password
 * @returns Promise<string> Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password
 * @param hash Hashed password from database
 * @returns Promise<boolean> True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Hash a quick access code using bcryptjs
 * @param code Plain text quick access code
 * @returns Promise<string> Hashed code
 */
export async function hashQuickAccessCode(code: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(code, salt);
}

/**
 * Compare a plain text quick access code with a hashed code
 * @param code Plain text quick access code
 * @param hash Hashed code from database
 * @returns Promise<boolean> True if code matches
 */
export async function verifyQuickAccessCode(code: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(code, hash);
}
