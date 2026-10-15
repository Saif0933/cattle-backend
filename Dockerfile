# # Use the official Bun image as the base
# FROM oven/bun:latest

# # Set the working directory inside the container
# WORKDIR /app

# # Copy package.json and lock file to install dependencies
# COPY package.json bun.lock ./

# # Install dependencies (using frozen lockfile for deterministic installs)
# RUN bun install --frozen-lockfile

# # Copy Prisma schema and configuration
# COPY prisma ./prisma
# # Copy prisma.config.ts if it exists and is needed
# COPY prisma.config.ts ./

# # Generate the Prisma client
# RUN bunx prisma generate

# # Copy the application source code
# COPY src ./src
# COPY tsconfig.json ./

# # The application listens on port 3000 by default
# EXPOSE 3000

# # Command to run the application
# CMD ["bun", "run", "src/index.ts"]



FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts ./

# ADD THIS
COPY .env .env

RUN bunx prisma generate

COPY . .

EXPOSE 4000

CMD ["bun", "run", "src/index.ts"]