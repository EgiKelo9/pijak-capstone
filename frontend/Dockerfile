FROM node:20-alpine

# Next.js requires libc6-compat for its SWC compiler on Alpine Linux
RUN apk add --no-cache libc6-compat

# Enable pnpm natively
RUN npm install -g pnpm

WORKDIR /app

# Copy the pnpm lockfile alongside the package.json
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm strictly from the lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Start the development server
CMD ["pnpm", "run", "dev"]