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