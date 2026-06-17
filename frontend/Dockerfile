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

# Set build-time environment variables for Next.js compilation
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_ML_API_URL
ENV NEXT_PUBLIC_ML_API_URL=$NEXT_PUBLIC_ML_API_URL

ARG BACKEND_USER_EMAIL
ENV BACKEND_USER_EMAIL=$BACKEND_USER_EMAIL

ARG BACKEND_USER_PASSWORD
ENV BACKEND_USER_PASSWORD=$BACKEND_USER_PASSWORD

# Build the application
RUN pnpm run build

# Expose production port
EXPOSE 3000

# Start the production server
CMD ["pnpm", "run", "start"]