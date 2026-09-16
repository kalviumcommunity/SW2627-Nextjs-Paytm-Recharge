# 📱 Recharge History with Live Transaction Polling

A React-based recharge management application inspired by Paytm's recharge flow. The application allows users to perform mobile recharges, view recharge history with real-time transaction status updates, filter transactions, and prevent accidental duplicate recharges.

---

## 🚀 Project Overview

This project simulates a real-world fintech recharge experience where:

- Users can perform a mobile recharge.
- Newly created transactions appear instantly in the history.
- Transaction status updates automatically without refreshing the page.
- Users can filter recharge history by date and operator.
- Duplicate recharges are prevented within a 10-second window.

---

## ✨ Features

### 🔹 Recharge Mobile Number

Users can:

- Enter Mobile Number
- Select Operator
- Enter Recharge Amount
- Submit Recharge

After submission:

- A new transaction is created.
- Initial status is **Pending**.
- Transaction is immediately added to the recharge history.

---

### 🔹 Live Transaction Status Polling

The application continuously checks the backend for updated transaction statuses.

Example flow:

```
Pending
   ↓
Polling every 5 seconds
   ↓
Success / Failed
```

No manual refresh is required.

---

### 🔹 Recharge History

Displays all recharge transactions including:

- Transaction ID
- Mobile Number
- Operator
- Recharge Amount
- Recharge Date & Time
- Current Status

Newest transactions appear at the top.

---

### 🔹 Filter Transactions

Users can filter recharge history using:

- Operator
- Date Range

Filters can be combined for more refined results.

---

### 🔹 Duplicate Recharge Prevention

To prevent accidental multiple payments, the application blocks duplicate recharge attempts.

A recharge is considered duplicate if all of the following match:

- Mobile Number
- Operator
- Recharge Amount

within **10 seconds** of the previous request.

Example:

```
9876543210
Jio
₹299

↓

Recharge

↓

User clicks Recharge again within 10 seconds

↓

Blocked
```

---

## 🛠 Tech Stack

### Frontend

- React
- React Router
- Axios
- Tailwind CSS
- React Hooks

### Backend (Mock)

- JSON Server / Express API

---

## 📂 Folder Structure

src/
│
├── components/
│   ├── RechargeForm.jsx
│   ├── RechargeHistory.jsx
│   ├── TransactionCard.jsx
│   └── Filters.jsx
│
├── hooks/
│   └── usePolling.js
│
├── services/
│   └── api.js
│
├── utils/
│   └── duplicateCheck.js
│
├── pages/
│   └── Home.jsx
│
├── App.jsx
└── main.jsx

---

## 🔄 Application Flow

User enters recharge details
            │
            ▼
     Submit Recharge
            │
            ▼
     POST /recharge
            │
            ▼
 Transaction created
(Status = Pending)
            │
            ▼
Added instantly to history
            │
            ▼
Polling starts
            │
            ▼
GET /transactions
            │
            ▼
Status changes
            │
            ▼
UI updates automatically

---

## 📡 API Endpoints

### Create Recharge

POST /recharge

Example Request

json
{
  "mobile": "9876543210",
  "operator": "Jio",
  "amount": 299
}

Example Response

json
{
  "transactionId": "TXN1001",
  "status": "PENDING"
}

---

### Get Transactions

GET /transactions

Returns all recharge transactions.

---

### Get Single Transaction

GET /transactions/:id

Returns details for a single recharge.

---

## 📊 Status Flow

Pending
   │
   ├────────► Success
   │
   └────────► Failed
Status updates are received through polling.

---

## ⚙️ Installation

### Prerequisites

- Node.js (>= 18) and npm installed.

### Steps

1. Clone the repository:

```bash
git clone <repository-url>
```

2. Navigate into the project directory (replace with the actual folder name, e.g., `paytm-recharge`):

```bash
cd paytm-recharge
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. (Optional) Start the mock backend server in a separate terminal:

```bash
npm run server
```

> **Note:** Ensure any required environment variables are defined in a `.env.local` file if the project uses them.
---

## 🎯 Future Improvements


Authentication

Search by Mobile Number

Infinite Scrolling

Pagination

Export Recharge History

Dark Mode

Push Notifications

WebSocket-based real-time updates (instead of polling)

---

## 📌 Assumptions


Transaction status is updated by the backend.

Polling occurs every **5 seconds**.

Duplicate recharge prevention is handled on the client side.

Date filtering is based on the transaction creation time.

---

## 📷 Screens


Recharge Form

Recharge History

Live Status Updates

Filters

Duplicate Recharge Warning

---

## 👨‍💻 Author

Built as a frontend system design assignment demonstrating:


React Fundamentals

API Integration

State Management

Polling

Real-Time UI Updates

Filtering

Duplicate Request Prevention

Component-Based Architecture

---