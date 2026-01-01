# Sto4ages Booking Platform
## System Architecture, UI Flow & Business Rules

#### Version: 2.1
#### Last Updated: January 1, 2026
#### Owner: Sto4ages Engineering

### 1. Purpose

This README is the single source of truth for the Sto4ages booking platform.

It defines:

System architecture

Firebase Authentication behavior

Firestore data models

UI/UX flow rules

Business package logic (Platinum & Diamond)

Admin dashboard functionality

Flexible day selection and surcharge system

AI prompting standards for future development

This document exists to:

Eliminate ambiguity

Prevent regressions

Ensure consistent results when working with AI agents (e.g. Windsurf / SWE-1.5)

Support future feature expansion (payments, admin, etc.)

### 2. High-Level Architecture
Application Type

Single-page React web application

No routing library

Navigation handled via an internal UI state machine

Core Files

src/firebaseConfig.jsx
Initializes Firebase once and exports:

auth (Firebase Authentication)

db (Cloud Firestore)

src/main.jsx
Mounts <App /> and imports Firebase config once

src/App.jsx
Central controller for:

Authentication

Email verification

Registration

Booking

Dashboard (User & Admin)

UI flow and UX logic

### 3. Firebase Authentication Rules
Supported Auth Methods

Email + Password

Google Sign-In

Explicit Exclusions

Apple Sign-In (disabled)

No custom OAuth handling

No password storage in Firestore

Auth Principles

Firebase Auth = identity only

Firestore = application data

UID = global identifier

### 4. Email Verification Flow
Applies To

Email/Password users only

Behavior

Verification email sent once on signup

User clicks verification link

Firebase verifies the email

App requires manual refresh:

auth.currentUser.reload()


Only verified users may proceed

Notes

Google users are considered verified

Verification URLs must use Firebase's hosted handler:

https://<project-id>.firebaseapp.com/__/auth/action

### 5. Password Reset Flow
Entry Point

"Forgot password?" link on the Login panel

Behavior

Uses sendPasswordResetEmail

No navigation

No page reload

Same success message whether email exists or not

Security Rule

Never reveal if an account exists

### 6. UI State Machine (No Router)

Valid page states:

"auth"

"verify"

"register"

"booking"

"dashboard"

Users must never land on an invalid state.

### 7. User Profile (Firestore)
Collection
users/{uid}

Fields

name (string)

email (string)

phone (string)

isAdmin (boolean) - Admin access flag

createdAt (server timestamp)

Rules

Document ID must equal UID

Use setDoc(..., { merge: true })

Google users may add phone number later via Dashboard prompt

### 8. Booking System (Firestore)
Collection
bookings/{uid}

Rules

One booking per user

Document ID equals UID

Updates overwrite the same document

### 9. Business Packages (Source of Truth - UPDATED)
✅ Platinum Package (Free / Standard)

Available return days:
Monday & Friday only (2 operating days)

Time selection:
❌ User cannot select time
Time is communicated manually between Sto4ages and the client

Drop-off address: Required

Price: R0 (Free)

💎 Diamond Package (Paid Tier - ENHANCED)

Standard operating days: 3 days
Standard available days: Monday, Wednesday, Friday

Flexible day selection: Tuesday & Thursday available with +R200 surcharge

Time selection:
✅ User may choose their own time (from system-defined slots)

Drop-off address: Required

Base Price: R200 (ZAR)
Flexible Day Surcharge: +R200 (Tue/Thu only)

Payment handling:
Not implemented yet (future feature)

### 10. Booking Data Model (Final - UPDATED)
packageType: "Platinum" | "Diamond"

allowedReturnDays: string[]
// Platinum → ["MON","FRI"]
// Diamond → ["MON","WED","FRI","TUE","THU"]

selectedReturnDay: "MON" | "TUE" | "WED" | "THU" | "FRI"

returnDate: string

returnTime: string | null
// null for Platinum

dropOffAddress: string

price: number
// 0 for Platinum, 200+ for Diamond (base + surcharges)

currency: "ZAR"

paymentStatus: "not_required" | "pending" | "paid"

createdAt: serverTimestamp

penaltyApplied: boolean
// Late booking penalty status

penaltyAmount: number
// R500 for late bookings

// Diamond flexible day selection fields
isNonOperationalDay: boolean
// true for Diamond Tue/Thu selections

nonOperationalDayFee: number
// R200 for flexible day selections

totalSurcharge: number
// Total surcharge amount (currently same as fee)

### 11. Dashboard UX Rules

#### User Dashboard
Phone Number Completion (Google Users)

If users/{uid}.phone is missing:

Show a non-blocking prompt

Allow inline submission

Save using setDoc(..., { merge: true })

Do NOT:

Redirect user

Block dashboard access

Re-run registration

In-App Package Change

Users can change packages directly from booking page via modal

No navigation to separate registration page

Package selection updates UI dynamically (date/time options)

#### Admin Dashboard (NEW)
Access Control

Admin access determined by users/{uid}.isAdmin === true

Standard Firebase Auth login (no separate admin system)

UI-level enforcement (Phase 1)

Read-Only Operations

No write/edit/delete capabilities

Client-side filtering only

No Firestore rule modifications for admin access

Core Features

Weekly booking overview (Monday-Friday grouping)

Package type distinction (Diamond vs Platinum)

User contact details display (name, email, phone, address)

Penalty information visibility

Flexible day surcharge tracking

Advanced date filtering with presets

### 12. Admin Dashboard Features (NEW - UPDATED)

#### Operational Views
Weekly Grouping

Bookings grouped by ISO week

Within each week: Monday → Friday

Within each day: Diamond first (by time), then Platinum (by name)

Empty day states: "No returns scheduled"

Contact Information

Full user details for operational coordination

Email and phone visibility for outreach

Drop-off address information

Penalty Tracking

Visual penalty indicators on booking cards

Summary card showing total penalties and amount

Orange highlighting for penalty cases

Flexible Day Surcharge Tracking (NEW)

Visual surcharge indicators on Diamond booking cards

Summary card showing total flexible day surcharges

Blue highlighting for surcharge cases

#### Advanced Filtering (NEW)
Date Dimensions

Return/Delivery Date (returnDate) - Default

Booking Created Date (createdAt) - Alternative

Quick Date Presets

Today - Start/end of current day

This Week - Monday to Sunday (ISO week)

Next 7 Days - Today to Today + 7 days

This Month - First to last day of current month

Custom Range - Manual date selection

Package Filtering

All / Platinum / Diamond options

Combined with date filters

Clear Filters

One-click reset to defaults

#### UI Layout
Desktop: 5-column grid (Date Type, Preset, Start Date, End Date, Package/Clear)

Mobile: Stacked vertical layout

Responsive design with no horizontal scrolling

### 13. Global Operating Rules (NEW)

#### Universal Restrictions
All return operations are limited to Monday–Friday (Mon–Fri)

The booking calendar must never allow weekend selection

Bundle benefits apply Mon–Fri only

A minimum 7-day advance booking requirement applies to all packages

#### Package-Specific Logic
Platinum Package

Operating Days: 2 days only

Allowed Return Days: Monday & Friday

System behavior:

Calendar must only allow Monday and Friday

No overrides

No additional day selection

No surcharges available

Customers may:

Select a return date (Mon/Fri only)

Choose a drop-off address

Diamond 💎 Package

Standard Operating Days: 3 days

Standard Allowed Days: Monday / Wednesday / Friday

System behavior:

Calendar must allow Mon/Wed/Fri by default

Time-slot selection is allowed (no all-day availability)

#### Diamond-Only Feature – Flexible Day Selection (NEW)

Diamond customers may select any weekday outside standard operating days (e.g. Tuesday or Thursday).

Rules:

Selecting a non-standard day must:

Trigger an automatic +R200 surcharge

Be clearly shown to the user before confirmation

This option:

Is exclusive to Diamond

Is not available to Platinum users

The +R200 reflects the Diamond package's added flexibility value.

### 14. Firestore Security Rules (UPDATED)

#### Current Rules (Phase 1)
```javascript
match /bookings/{bookingId} {
  // CREATE: booking does not exist yet
  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.userId;

  // UPDATE / DELETE: booking already exists
  allow update, delete: if request.auth != null
    && request.auth.uid == resource.data.userId;

  // READ: Phase-1 admin dashboard (read-only)
  allow read: if request.auth != null;
}

match /users/{userId} {
  // READ: required for admin dashboard contact visibility (Phase-1)
  allow read: if request.auth != null;

  // WRITE: users may only update their own profile
  allow write: if request.auth != null
    && request.auth.uid == userId;
}
```

#### Security Model
Read Access

Any authenticated user can read booking documents (admin dashboard support)

Any authenticated user can read user profiles (contact details)

Write Access

Booking owners can create/update/delete their own bookings

Users can only update their own profiles

Admin Enforcement

UI-level only for Phase 1 (no custom auth claims)

Read-only dashboard prevents data modification

### 15. UX & Error Handling Principles

No dead ends

Clear primary action per screen

Loading states prevent double submission

Friendly error messages only

Firebase error codes logged to console only

Admin dashboard includes contextual empty states

Real-time surcharge warnings for flexible day selections

### 16. Security Principles

Firestore Rules (Current)

Users can read all booking documents (admin dashboard requirement)

Users can only write their own booking documents

Users can read all user profiles (admin contact details)

Users can only write their own user profiles

request.auth.uid must match document ownership for writes

Admin access enforced at UI level (Phase 1)

### 17. AI Prompting Standard (Important)

When prompting Windsurf / SWE-1.5:

Always include:

Non-negotiable constraints

Source-of-truth section

Explicit "DO NOT" list

UI flow guarantees

Firestore schema expectations

Admin dashboard requirements

Package system specifications

Flexible day selection rules

Change reporting requirements

This README should be referenced or embedded in future prompts.

### 18. Implementation Status (UPDATED)

#### Completed Features
✅ Package system (Platinum & Diamond)

✅ Updated operating days (Platinum: 2, Diamond: 3)

✅ Diamond flexible day selection (Tue/Thu with +R200 surcharge)

✅ Dynamic pricing calculation (base + surcharges)

✅ In-app package change modal

✅ Admin dashboard (read-only)

✅ Advanced date filtering with presets

✅ Penalty information display

✅ Flexible day surcharge tracking

✅ Phone number completion for Google users

✅ Firestore security rules (Phase 1)

✅ Weekly booking grouping

✅ Contact details visibility

✅ 7-day advance booking requirement

✅ Weekend blocking for all packages

#### Current Limitations
❌ Payment processing (Diamond packages)

❌ Custom auth claims for admin access

❌ Admin write/edit capabilities

❌ Multiple bookings per user

❌ Status lifecycle management

### 19. Future-Ready Notes

Planned extensions:

Payment processing (Stripe)

Custom auth claims for stricter admin access

Admin write/edit capabilities

Multiple bookings per user

Status lifecycle (pending, confirmed, completed)

Enhanced security rules (Phase 2)

All future changes must:

Extend this document

Not contradict existing rules

Maintain zero regression for existing flows

### 20. Package System Validation (NEW)

#### Platinum Package Validation
✅ Calendar only allows Monday & Friday selection
✅ No time selection available
✅ System-assigned time coordination
✅ Free pricing (R0)
✅ Manual coordination required

#### Diamond Package Validation
✅ Standard days: Monday, Wednesday, Friday
✅ Flexible days: Tuesday, Thursday with +R200 surcharge
✅ Time slot selection available
✅ Dynamic pricing: R200 (standard) or R400 (flexible)
✅ Real-time surcharge warnings
✅ Admin surcharge visibility

#### Cross-Package Validation
✅ No weekend selection for any package
✅ 7-day advance booking requirement enforced
✅ Package switching works correctly
✅ Surcharge logic applies only to Diamond flexible days
✅ Firestore records all surcharge details

### 21. Scope of Changes Compliance (NEW)

#### ✅ Changes Made (Allowed)
Booking logic updates
Pricing logic enhancements
UI improvements for package selection
Non-auth Firestore data model updates
Client-side validation rules
Admin dashboard enhancements
Calendar restriction updates

#### ❌ Explicitly Avoided (Prohibited)
Firebase Authentication modifications
Firestore auth collection changes
Security rule modifications tied to auth
User login/signup/session changes
UID handling modifications
Authentication flow changes

All changes strictly comply with the requirement to modify only booking logic, pricing logic, UI, and non-auth Firestore data levels.