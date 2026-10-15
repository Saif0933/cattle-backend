import dotenv from "dotenv";

dotenv.config();

interface Config {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  NODE_ENV: "development" | "production" | "test";
  
  // Media Config (Cloudinary/S3)
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;

  // Payments (Stripe/Razorpay)
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  STRIPE_SECRET_KEY?: string;

  // SMS / OTP Config
  SMS_GATEWAY_API_KEY?: string;
}

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL STARTUP ERROR: Environment variable '${key}' is missing!`);
  }
  return value;
};

export const config: Config = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),
  JWT_SECRET: process.env.JWT_SECRET || "cattle_ecosystem_premium_super_secret_key_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  NODE_ENV: (process.env.NODE_ENV as any) || "development",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,

  SMS_GATEWAY_API_KEY: process.env.SMS_GATEWAY_API_KEY,
};
