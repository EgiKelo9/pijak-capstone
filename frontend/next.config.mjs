// /** @type {import('next').NextConfig} */
// const nextConfig = {}

// export default nextConfig

import path from 'path';
import dotenv from 'dotenv';

// Read the .env file from one folder up (the root directory)
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Expose specific backend credentials from root .env to the Next.js frontend
    // Change "BACKEND_USER_EMAIL" to whatever the actual key is in your root .env
    NEXT_PUBLIC_MOCK_EMAIL: process.env.BACKEND_USER_EMAIL,
    NEXT_PUBLIC_MOCK_PASSWORD: process.env.BACKEND_USER_PASSWORD,
  },
};

export default nextConfig;
