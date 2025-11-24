# Subscription Billing System

A Microservices-Based Subscription Billing System built with **NestJS**, **TypeORM**, **PostgreSQL**, and **Docker**.

![Version](https://img.shields.io/badge/Version-1.0.0-blue)

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20.19.1+ (for local development)

### Start Everything

```bash
docker-compose up --build
```

This starts:
- **Subscription Service** (http://localhost:3000)
- **Payment Service** (http://localhost:3001)
- **PostgreSQL** instances for both services

---

## 📋 Overview

This system manages the complete subscription lifecycle through two independent, decoupled microservices:

| Service | Responsibility |
|---------|-----------------|
| **Subscription Service** | Users, plans, subscriptions, billing logic, webhook events for subscirptions |
| **Payment Service** | Payment processing simulation, retry logic (max 5 attempts), webhook callbacks |

### Key Features

-  Webhook-driven billing workflow
-  Clean microservices architecture
-  Isolated PostgreSQL databases (DPS)
-  Docker Compose for local development
-  Swagger documentation
-  Resource-based module design

---

## 🏛️ Architecture

```
End User
   |
   | Register / Subscribe
   v
Subscription Service              Payment Service
- Users                          - Simulate Payments
- Plans                          - Retry Logic
- Subscriptions                  - Store Records
- Pricing & Billing
   |
   | POST /payments/initiate
   v
Payment Service processes payment
   |
   | POST /webhooks/payment
   v
Subscription Service updates status
```

---

## 📊 Data Model

### User

```json
{
  "id": "uuid",
  "firstName": "string",
  "lastName": "string",
  "email": "string (unique)",
}
```

### Plan

```json
{
  "id": "uuid",
  "name": "string (unique)",
  "manHours": "number",
  "pricePerManHour": "decimal",
  "billingCycle": "monthly | yearly | custom | free",
  "discount": "decimal (optional)",
  "features": "json (optional)"
}
```

### Subscription

```json
{
  "id": "uuid",
  "userId": "uuid",
  "planId": "uuid",
  "status": "pending_payment | active | canceled | expired | failed",
  "manHoursUsed": "number",
  "totalCost": "decimal",
  "paymentStatus": "pending | success | failed",
  "startDate": "timestamp",
  "endDate": "timestamp | null"
}
```

### Payment

```json
{
  "id": "uuid",
  "subscriptionId": "uuid",
  "amount": "decimal",
  "currency": "string",
  "status": "pending | success | failed",
  "attempts": "number (max 5)",
  "createdAt": "timestamp"
}
```

---

## 🔄 API Workflow

### Step 1: User Registration

User registers and automatically gets a **Free plan subscription**.

**Free plan features:**
- `billingCycle`: free
- `status`: active
- `paymentStatus`: success
- No expiration date

### Step 2: Subscribe to Paid Plan

```bash
POST /subscriptions
Content-Type: application/json

{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
  "manHours": 10
}
```

**Subscription Service:**
- Retrieves plan details
- Calculates price: `manHours × pricePerManHour`
- Applies discounts
- Creates subscription with `status: pending_payment`
- Initiates payment with Payment Service

### Step 3: Payment Processing

Payment Service receives payment initiation and:
- Records payment record
- Simulates success/failure scenario
- Retries up to 5 times on failure
- Sends webhook callback to Subscription Service

### Step 4: Subscription Status Update

Based on webhook result:
- **Success** → `status: active`, `paymentStatus: success`
- **Failure** → `status: failed`, `paymentStatus: failed`

---

## 🔌 Service Endpoints

### Subscription Service

**Base URL:** `http://localhost:3001`

**Swagger Docs:** `http://localhost:3001/api`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users` | POST | Register new user |
| `/users/:id` | GET | Get user details |
| `/plans` | GET | List all plans |
| `/subscriptions` | POST | Create subscription |
| `/subscriptions/:id` | GET | Get subscription details |
| `/webhooks/payment` | POST | Receive payment webhook |

### Payment Service

**Base URL:** `http://localhost:3002`

**Swagger Docs:** `http://localhost:3002/api`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/payments/initiate` | POST | Start payment process |
| `/payments/:id` | GET | Get payment details |
| `/payments/:id/retry` | POST | Retry failed payment |

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Run specific service tests
pnpm test subscription-service
pnpm test payment-service
```

Tests use **Jest** and **Supertest** for comprehensive coverage.

---

## 📁 Project Structure

```
/services
├── /subscription-service
│   ├── /src
│   │   ├── /users
│   │   ├── /plans
│   │   ├── /subscriptions
│   │   ├── /common
│   │   └── main.ts
│   ├── Dockerfile
│   └── .env
├── /payment-service
│   ├── /src
│   │   ├── /payments
│   │   ├── /webhooks
│   │   ├── /common
│   │   └── main.ts
│   ├── Dockerfile
│   └── .env
├── docker-compose.yml
├── package.json
└── README.md
```

**Each module includes:**
- **DTOs** - Data Transfer Objects for validation
- **Entities** - Database entities
- **Controllers** - HTTP endpoints
- **Services** - Business logic
- **Swagger Decorators** - Auto-documented APIs

---

## 🛠️ Development

### Install Dependencies

```bash
pnpm install
```

### Run Services Locally

```bash
# Terminal 1 - Subscription Service
cd services/subscription-service
pnpm start:dev

# Terminal 2 - Payment Service
cd services/payment-service
pnpm start:dev
```

### Environment Variables

**Subscription Service (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5433/subscription_db
PORT=3001
```

**Payment Service (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5434/payment_db
PORT=3002
SUBSCRIPTION_SERVICE_URL=http://localhost:3001
```

---

## 💡 Design Principles

- **Stateless HTTP Communication** - Services are independently scalable
- **Webhook-Driven Architecture** - Asynchronous billing workflows
- **Separate Databases** - No cross-service DB queries
- **Resource-Based Modules** - Clean code organization
- **Independently Deployable** - Each service has its own lifecycle
- **API Documentation** - Auto-generated Swagger specs

---

## 🚀 Future Enhancements

- [ ] Full CRUD for plans (admin dashboard)
- [ ] Advanced filtering by billing cycle
- [ ] Federated authentication (Google, GitHub, Okta)
- [ ] Usage-based billing metrics
- [ ] Invoice and receipt generation
- [ ] Email notifications (confirmation, renewal, expiry)
- [ ] Real payment gateway integration (Stripe, PayPal)
- [ ] Multi-currency & regional pricing
- [ ] Subscription upgrade/downgrade workflows
- [ ] Admin analytics dashboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | NestJS 10+ |
| **Database** | PostgreSQL 15+ |
| **ORM** | TypeORM |
| **Containerization** | Docker & Docker Compose |
| **Testing** | Jest & Supertest |
| **API Docs** | Swagger/OpenAPI |
| **Package Manager** | pnpm |

---
