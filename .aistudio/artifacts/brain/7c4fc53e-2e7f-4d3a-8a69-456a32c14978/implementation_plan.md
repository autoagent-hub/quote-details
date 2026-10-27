# Implementation Plan - Credit-Based Billing & Flutterwave Integration

## Overview
Implement a credit-based billing model where credits are deducted strictly based on bot usage (e.g., 1 credit per AI bot quote calculation or AI interaction), with low balance notifications (under 10 credits) and Flutterwave checkout for custom credit reloads.

---

## Proposed Changes

### 1. Database Schema & Profile Credits (`profiles` table or user metadata)
- Add or ensure `credits_balance` (integer, default e.g. 50 free starting credits) exists on each detailer's profile or account metadata.
- Track credit deduction history or logs.

### 2. Credit Deduction Logic (`src/lib/credit.server.ts`)
- Create a server utility `deductCredit(userId: string, amount = 1): Promise<{ success: boolean; newBalance: number }>`:
  - Checks if user has `>= 1` credit.
  - Deducts 1 credit from `profiles.credits_balance`.
  - If balance drops below 10 credits, trigger a dashboard banner / notification warning ("Low credit balance: X remaining").
- Hook this into bot usage events:
  - Customer quote calculation / AI estimation (`src/lib/quote.functions.ts` or quote API endpoint).
  - Telegram bot AI responses or incoming lead alerts processed via bot.

### 3. Flutterwave Payment Integration (`src/lib/flutterwave.functions.ts` & UI)
- Integrate Flutterwave checkout for credit top-ups:
  - Custom reload amounts (e.g., $10 = 100 credits, $25 = 300 credits, or custom user-defined amount).
  - Secure verification on return (`/billing/flutterwave-return` or webhook/verification function).
- Add credit top-up UI in the billing/upgrade page (`/upgrade`):
  - Display current credit balance.
  - Custom credit reload modal or purchase buttons using Flutterwave Standard/Inline checkout.

### 4. Low Balance & Bot Alerts
- When credits drop below 10, display a persistent warning banner on the dashboard ("Low Credits: Only X credits remaining. Top up via Flutterwave to keep your AI bot running").
- Prevent quote bot generation if credits reach 0, prompting a quick top-up modal.

---

## Verification Plan
1. **Automated Build & Lint**: Run `compile_applet` and `lint_applet` to ensure zero syntax or build errors.
2. **Interactive Verification**: Test credit deduction upon generating a quote / AI bot action, and test Flutterwave checkout initialization.
