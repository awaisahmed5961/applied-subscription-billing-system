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
pnpm install

docker compose -f docker-compose.dev.yml up --build
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
| **Subscription Service** | Users, plans, subscriptions, billing logic, webhook events for subscirptions, referrals |
| **Payment Service** | Secure Payment processing simulation, retry logic (max 5 attempts), webhook callbacks |

### Key Features

-  Webhook-driven billing workflow
-  Clean microservices architecture
-  Isolated PostgreSQL databases per service(DPS)
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

##  Data Model

### User

```json
{
  "id": "uuid",
  "firstName": "string",
  "lastName": "string",
  "email": "string (unique)",
  "isActive": "boolean"
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
  "status": "string (pending_payment | active | canceled | expired | failed)",
  "startDate": "date",
  "endDate": "date",
  "manHoursUsed": "number",
  "totalCost": "number",
  "paymentStatus": "string (pending | success | failed)",
  "paymentId": "uuid",
  "pendingChange": {
    "type": "string (upgrade | downgrade | cancel)",
    "newPlanId": "uuid",
    "newManHours": "number",
    "applyAt": "string (next_billing_period | immediate )",
    "effectiveDate": "date"
  },
}
```

### Referral

```json
{
  "id": "uuid",
  "code": "string",
  "bonusManHours": "number",
  "startsAt": "timestamp",
  "endsAt": "timestamp",
  "maxUses": "number | null",
  "usedCount": "number",
  "isActive": "boolean"
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

## API Workflow

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

##  Service Endpoints

### Subscription Service

**Base URL:** `http://localhost:3000`
**Swagger Docs:** `http://localhost:3000/api`

| Endpoint | Method | Purpose |
|-----------------------------------|---------|-------------------------------------------------|
| `/users`                          | POST    | Register new user with email & password         |
| `/users/:id`                      | GET     | Get user details (plan, subscription, referral) |
| `/plans`                          | GET     | List all plans (with billing cycle filtering)   |
| `/subscriptions`                  | POST    | Create subscription                             |
| `/subscriptions/{id}/upgrade`     | POST    | Upgrade subscription                            |
| `/subscriptions{id}/downgrade`    | POST    | Downgrade subscription                          |
| `/subscriptions/{id}/cancel`      | POST    | Cancel subscription                             |
| `/subscriptions/:id`              | GET     | Get subscription details for logged in user     |
| `/webhooks/payment`               | POST    | Receive payment webhook                         |

### Payment Service

**Base URL:** `http://localhost:3001`
**Swagger Docs:** `http://localhost:3001/api`

| Endpoint | Method | Purpose |
|----------------------|--------|-----------------------|
| `/payments/initiate` | POST   | Start payment process |

---


##  Project Structure

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
│   └── .env.example
├── /payment-service
│   ├── /src
│   │   ├── /payments
│   │   ├── /webhooks
│   │   ├── /common
│   │   └── main.ts
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.ev.yml
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

##  Development

### Install Dependencies

```bash
pnpm install

pnpm run dev:subscription

pnpm run dev:payment

pnpm run dev:all

```



### Environment Variables

**Subscription Service (.env.example)**
```env
PORT=3000
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=subscription_db
JWT_SECRET=7f3c1d7a8e9b4f52b1c0d3a8f9e6c2d1a4b7f0e9d3c6b2a7f1c4d8e9b0a6f3
JWT_EXPIRES_IN=1h
PAYMENT_SERVICE_URL=http://payment-service:3001
SUBSCRIPTION_WEBHOOK_URL=http://subscription-service:3000
PAYMENT_SERVICE_KEY=psk_3Kf9mQ2zT8nP4wY7sB1uR5cV9eL2hG6xD0aJ4kN8pQ3tV6rZ
PAYMENT_WEBHOOK_SECRET=t3Lp8Xw2Vn5Cr1Jg7Yp0Ks4Df8Mh2Rb6Uc9Ei3Qo7Tw1Zn5Hp8Yc2h76h8cderLd6
PAYMENT_SHARED_SECRET=hmac_6Aq9Zt3Lp8Xw2Vn5Cr1Jg7Yp0Ks4Df8Mh2Rb6Uc9Ei3Qo7Tw1Zn5Hp8Yc2Lr6
SUBSCRIPTION_WEBHOOK_SECRET=whsec_92f7c3b8e1d4a6f9b2c5d7e0a3f6c9b1d4e7f0a2c8b3d6e9f1a4c7d0b2e5

```

**Payment Service (.env.example)**
```env
PORT=3001
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=payment_db
JWT_SECRET=7f3c1d7a8e9b4f52b1c0d3a8f9e6c2d1a4b7f0e9d3c6b2a7f1c4d8e9b0a6f3
JWT_EXPIRES_IN=1h
PAYMENT_SERVICE_KEY=psk_3Kf9mQ2zT8nP4wY7sB1uR5cV9eL2hG6xD0aJ4kN8pQ3tV6rZ
SUBSCRIPTION_WEBHOOK_SECRET=whsec_92f7c3b8e1d4a6f9b2c5d7e0a3f6c9b1d4e7f0a2c8b3d6e9f1a4c7d0b2e5
JWT_SECRET=some-secret-unique-or-shared
JWT_EXPIRES_IN=7d
PAYMENT_SHARED_SECRET=hmac_6Aq9Zt3Lp8Xw2Vn5Cr1Jg7Yp0Ks4Df8Mh2Rb6Uc9Ei3Qo7Tw1Zn5Hp8Yc2Lr6
```

---

## 💡 Design Principles

- **Stateless HTTP Communication** - Services are independently scalable
- **Webhook-Driven Architecture** - Asynchronous billing workflows
- **Separate Databases** - No cross-service DB queries
- **Resource-Based Modules** - Clean code organization
- **Independently Deployable** - Each service has its own lifecycle
- **API Documentation** -  Swagger specs

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


