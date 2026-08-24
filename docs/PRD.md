# Product Requirements Document (PRD)

# Paytm Recharge History with Live Transaction Status

**Version:** 1.0  
**Project Duration:** 10 Days  
**Team Size:** 3 Developers  
**Tech Stack:** Next.js (App Router), TypeScript, PostgreSQL, Prisma ORM, Tailwind CSS, React Query

---

# 1. Project Overview

## Objective

Develop a recharge history system similar to Paytm where:

- Users can perform a mobile recharge.
- Every recharge is stored in PostgreSQL.
- Transactions initially appear as **Pending**.
- The application continuously polls the backend for status updates.
- The transaction list updates automatically without refreshing the page.
- Users can filter transactions by date and operator.
- Duplicate recharge requests within 10 seconds are prevented.

---

# 2. Problem Statement

Current recharge systems often require manual refreshes to view updated transaction statuses, leading to a poor user experience.

The objective is to build a modern recharge history system that:

- Updates transaction statuses automatically.
- Provides filtering capabilities.
- Prevents accidental duplicate payments.
- Delivers a responsive and user-friendly interface.

---

# 3. Goals

## Functional Goals

- Recharge mobile numbers
- Save transactions in PostgreSQL
- Display recharge history
- Live status updates
- Date filtering
- Operator filtering
- Prevent duplicate recharge within 10 seconds

---

## Non Functional Goals

- Responsive UI
- Fast API response
- Scalable backend
- Clean architecture
- Reusable components
- Type-safe code

---

# 4. Users

Primary Users

- Customers performing mobile recharge

Future Users

- Admin
- Customer Support

---

# 5. User Stories

### US-1 Recharge

As a user,

I want to recharge my mobile

so that I can complete my payment.

---

### US-2 Recharge History

As a user,

I want to view my recharge history

so that I can check previous transactions.

---

### US-3 Live Status

As a user,

I want transaction status to update automatically

so that I don't need to refresh the page.

---

### US-4 Filters

As a user,

I want to filter transactions

by operator and date

so that I can quickly find transactions.

---

### US-5 Duplicate Prevention

As a user,

I should not accidentally recharge twice

within 10 seconds.

---

# 6. Functional Requirements

## FR-1 Recharge

### Input

- Mobile Number
- Operator
- Amount

### Validation

- Mobile number must be 10 digits
- Amount must be greater than zero
- Operator is required

### Flow

```
User

↓

Fill Form

↓

Validate

↓

Check Duplicate

↓

Create Transaction

↓

Status = Pending

↓

Return Success
```

---

## FR-2 Recharge History

Display

- Mobile Number
- Operator
- Amount
- Status
- Date & Time

Sorting

Newest First

---

## FR-3 Live Status Polling

Every 5 seconds

Client calls

```
GET /api/status/:id
```

If status changes

Update UI automatically

No page refresh

---

## FR-4 Date Filter

Supported Filters

- Today
- Yesterday
- Last 7 Days
- Last 30 Days
- Custom Range

---

## FR-5 Operator Filter

Operators

- Airtel
- Jio
- Vi
- BSNL

---

## FR-6 Duplicate Recharge Prevention

Duplicate means

Same

- Mobile Number
- Operator
- Amount

Within

10 seconds

System returns

```
409 Conflict
Duplicate Recharge
```

---

# 7. Non Functional Requirements

Performance

- API response < 500 ms
- UI updates instantly

Scalability

- Modular architecture
- Prisma ORM
- Reusable APIs

Security

- Input validation
- SQL Injection prevention
- Type-safe backend

Usability

- Mobile responsive
- Clean UI
- Loading indicators

---

# 8. Database Design

## Users

| Field | Type |
|---------|------|
| id | Integer |
| name | String |
| email | String |
| phone | String |

---

## Operators

| Field | Type |
|---------|------|
| id | Integer |
| name | String |

---

## Recharge Transactions

| Field | Type |
|---------|------|
| id | Integer |
| transactionId | UUID |
| userId | Integer |
| operatorId | Integer |
| mobileNumber | String |
| amount | Decimal |
| status | Enum |
| createdAt | Timestamp |
| updatedAt | Timestamp |

---

# 9. Status Lifecycle

```
Pending

↓

Success

or

Failed
```

---

# 10. API Requirements

## Recharge

```
POST /api/recharge
```

Request

```json
{
  "mobileNumber": "9876543210",
  "operatorId": 1,
  "amount": 299
}
```

---

Response

```json
{
  "transactionId": "TXN001",
  "status": "Pending"
}
```

---

## Transaction History

```
GET /api/transactions
```

Optional Query Parameters

```
operator=

from=

to=
```

---

## Transaction Status

```
GET /api/status/:transactionId
```

---

## Operators

```
GET /api/operators
```

---

# 11. UI Requirements

## Recharge Page

Components

- Recharge Form
- Submit Button

---

## History Page

Components

- Filter Bar
- History Table
- Pagination (Optional)

---

## Status Badge

Possible Colors

Pending → Yellow

Success → Green

Failed → Red

---

# 12. Folder Structure

```
app/

    api/

        recharge/

        transactions/

        operators/

        status/

    recharge/

    history/

components/

    RechargeForm.tsx

    HistoryTable.tsx

    FilterBar.tsx

    StatusBadge.tsx

hooks/

    useTransactions.ts

    usePolling.ts

lib/

    prisma.ts

    validations.ts

    api.ts

prisma/

    schema.prisma
```

---

# 13. Live Update Flow

```
Recharge

↓

Pending

↓

Saved in Database

↓

Client starts polling

↓

Backend checks status

↓

Status changes

↓

Database updated

↓

Frontend refetches

↓

Table updates
```

---

# 14. Duplicate Recharge Flow

```
Recharge Request

↓

Check

Same Mobile

+

Same Operator

+

Same Amount

↓

Within 10 seconds?

↓

Yes

↓

Reject Request

↓

409 Conflict

↓

No

↓

Create Transaction
```

---

# 15. Team Responsibilities

## Shreshtha Yadav

Backend

- PostgreSQL
- Prisma
- APIs
- Duplicate Validation

---

## Kumar Manu Saraswat

Frontend

- Recharge Form
- History Table
- Filters
- Responsive UI

---

## Jatin Kumar

Integration

- React Query
- Polling
- API Integration
- Testing
- Deployment

---

# 16. Development Timeline

## Day 1

- Project Setup
- PostgreSQL
- Prisma
- Tailwind

---

## Day 2

- Database Design
- Recharge Form UI

---

## Day 3

- Recharge API
- Form Integration

---

## Day 4

- Transaction History API
- History UI

---

## Day 5

- Filters
- Duplicate Validation

---

## Day 6

- Polling
- Status API

---

## Day 7

- Live Updates
- UI Improvements

---

## Day 8

- Integration Testing

---

## Day 9

- Bug Fixes
- Performance Optimization

---

## Day 10

- Deployment
- Documentation
- Final Demo

---

# 17. Success Criteria

The project is considered complete when:

- Recharge can be created.
- Transactions are stored in PostgreSQL.
- History updates without page refresh.
- Status changes automatically.
- Date filter works.
- Operator filter works.
- Duplicate recharge is blocked within 10 seconds.
- Application is responsive.
- APIs are fully tested.
- Project is successfully deployed.

---

# 18. Future Enhancements

- Authentication
- Real payment gateway integration
- Push notifications
- Search by mobile number
- CSV export
- Pagination
- Admin dashboard
- Analytics
- Transaction details page
- Retry failed recharge