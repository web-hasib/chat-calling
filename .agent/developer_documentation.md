# Developer Documentation & Onboarding Guide

Welcome to the **Messenger-like Chat & Calling Application** repository! This document contains everything you need to know about the architecture, system setup, WebRTC flow, switchable storage architecture, and development standards.

---

## Directory Structure

The project is structured as a monorepo containing two main parts:
- **`backend(nest)/`**: The NestJS server handling authentication, databases (via Prisma), storage uploads, and WebSockets (signaling & real-time messaging).
- **`frontend(nextjs)/`**: The Next.js client built with the App Router, implementing clean Vanilla CSS modules, WebSockets client, and WebRTC peer connections.

---

## Technical Stack

- **Frontend**: Next.js 14+ (App Router), CSS Modules, HTML5 WebRTC API, Socket.io-client.
- **Backend**: NestJS, `@nestjs/websockets` (Socket.io), Prisma ORM, Passport.js (OAuth).
- **Database**: Neon DB (PostgreSQL).
- **File Storage**: Cloudinary & AWS S3 (Switchable Interface).

---

## Environment Configuration

Create a `.env` file in the root of both `backend(nest)` and `frontend(nextjs)` according to these templates.

### Backend Environment Variables (`backend(nest)/.env`)

```env
PORT=5000
DATABASE_URL="postgresql://user:password@neon-db-url/dbname?sslmode=require"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"

# File Storage Configuration (Switchable)
# Options: 's3' or 'cloudinary'
STORAGE_PROVIDER="cloudinary"

# AWS S3 Settings (Required if STORAGE_PROVIDER=s3)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-s3-bucket-name"

# Cloudinary Settings (Required if STORAGE_PROVIDER=cloudinary)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### Frontend Environment Variables (`frontend(nextjs)/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_WS_URL="ws://localhost:5000"
```

---

## Switchable Storage Architecture (Strategy Pattern)

To allow seamless toggling between Cloudinary and S3, we use a Strategy Pattern. Both drivers implement a common `StorageProvider` interface:

```typescript
export interface StorageProvider {
  uploadFile(file: Express.Multer.File): Promise<string>; // Returns the public file URL
  deleteFile(fileUrl: string): Promise<void>;
}
```

A wrapper module (`StorageModule`) decides which provider to inject based on the `STORAGE_PROVIDER` environment variable:

```typescript
@Module({
  providers: [
    {
      provide: 'StorageProvider',
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('STORAGE_PROVIDER');
        if (provider === 's3') {
          return new S3StorageProvider(configService);
        }
        return new CloudinaryStorageProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['StorageProvider'],
})
export class StorageModule {}
```

---

## WebRTC Audio & Video Calling Flow

Signaling is handled over WebSockets via Socket.io. Below is the workflow for setting up a call:

```mermaid
sequenceDiagram
    participant Caller as Caller (Client A)
    participant Server as NestJS WebSocket Gateway
    participant Receiver as Receiver (Client B)

    Caller->>Server: call-user { to: receiverId, offer, type: 'video'|'audio' }
    Server->>Receiver: incoming-call { from: callerId, offer, type }
    Receiver->>Server: accept-call { to: callerId, answer }
    Server->>Caller: call-accepted { answer }
    Note over Caller,Receiver: WebRTC Peer Connection Established (P2P Audio/Video starts)

    Note over Caller,Receiver: During call, candidates are exchanged:
    Caller->>Server: ice-candidate { to: receiverId, candidate }
    Server->>Receiver: ice-candidate { candidate }
    
    Note over Caller,Receiver: To end a call:
    Caller->>Server: end-call { to: receiverId }
    Server->>Receiver: call-ended
```

---

## Setup & Running Locally

### Step 1: Install Dependencies
Navigate into both folders and install:
```bash
# Backend
cd backend(nest)
npm install

# Frontend
cd ../frontend(nextjs)
npm install
```

### Step 2: Database Migration
Deploy your schema to Neon DB using Prisma:
```bash
cd backend(nest)
npx prisma db push
```

### Step 3: Run Development Servers
```bash
# Start backend (from backend(nest) directory)
npm run start:dev

# Start frontend (from frontend(nextjs) directory)
npm run dev
```
