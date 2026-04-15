FROM node:20-alpine

# Enable pnpm natively
RUN corepack enable pnpm

WORKDIR /app

# Copy the pnpm lockfile alongside the package.json
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application
COPY . .

# Start the development server (for the VPS)
CMD ["pnpm", "run", "dev"]