import crypto from "crypto";
import { config } from "../config/env";

const base64UrlEncode = (str: string): string => {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
};

export class JwtService {
  /**
   * Generates a secure HS256 JWT token using native Node crypto.
   */
  static generateToken(payload: Record<string, any>, expiresInSeconds: number = 604800): string {
    const header = { alg: "HS256", typ: "JWT" };
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + expiresInSeconds;

    const fullPayload = {
      ...payload,
      iat: issuedAt,
      exp: expiresAt,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac("sha256", config.JWT_SECRET)
      .update(signatureInput)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    return `${signatureInput}.${signature}`;
  }

  /**
   * Verifies an HS256 JWT token and extracts the decoded payload.
   */
  static verifyToken(token: string): Record<string, any> | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      if (!encodedHeader || !encodedPayload || !signature) {
        return null;
      }
      const signatureInput = `${encodedHeader}.${encodedPayload}`;

      // Verify the HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac("sha256", config.JWT_SECRET)
        .update(signatureInput)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      if (signature !== expectedSignature) {
        return null; // Invalid signature
      }

      const decodedPayload = JSON.parse(base64UrlDecode(encodedPayload));

      // Verify expiration time
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp && currentTime > decodedPayload.exp) {
        return null; // Token expired
      }

      return decodedPayload;
    } catch (e) {
      return null; // Error parsing or decoding
    }
  }
}
