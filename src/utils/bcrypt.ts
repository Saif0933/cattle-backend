import crypto from "crypto";

export class HashService {
  private static readonly ITERATIONS = 10000;
  private static readonly KEY_LENGTH = 64;
  private static readonly DIGEST = "sha512";

  /**
   * Hashes a password securely using PBKDF2 and a unique salt.
   * Returns a consolidated hash string formatted as: `pbkdf2$iterations$salt$hash`
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(
        password,
        salt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        this.DIGEST
      )
      .toString("hex");

    return `pbkdf2$${this.ITERATIONS}$${salt}$${hash}`;
  }

  /**
   * Compares a plain text password against a saved secure PBKDF2 hash.
   */
  static comparePassword(password: string, storedHashString: string): boolean {
    try {
      const parts = storedHashString.split("$");
      if (parts.length !== 4 || parts[0] !== "pbkdf2") {
        return false;
      }

      const [, iterationsStr, salt, hash] = parts;
      if (!iterationsStr || !salt || !hash) {
        return false;
      }
      const iterations = parseInt(iterationsStr, 10);

      const computedHash = crypto
        .pbkdf2Sync(
          password,
          salt,
          iterations,
          this.KEY_LENGTH,
          this.DIGEST
        )
        .toString("hex");

      return computedHash === hash;
    } catch (e) {
      return false;
    }
  }
}
export const bcrypt = HashService;
