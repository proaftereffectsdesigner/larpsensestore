# LarpSense Store

![LarpSense UI Overview](https://img.shields.io/badge/Status-Active_Development-emerald)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E?logo=supabase)
![Stripe](https://img.shields.io/badge/Stripe-Payments-6366F1?logo=stripe)

LarpSense Store is a premium, full-stack e-commerce platform built for the seamless delivery of digital products (Non-Full Access accounts). Engineered with a focus on high performance, modern "hacker-chic" aesthetics, and rock-solid security, it serves as a fully automated gateway linking customers with instant digital goods.

This repository demonstrates advanced full-stack capabilities, bridging a polished frontend experience with robust backend orchestration, secure payment processing, and external API integrations.

## ✨ Key Features

### 🎨 Modern, Interactive UI/UX
- **Premium Aesthetics:** Dark mode by default, glassmorphism, glowing neon accents, and smooth micro-interactions.
- **Scroll Animations:** Native `IntersectionObserver` integrations for cascading fade-ins (Scroll Reveals) for a dynamic feel.
- **Responsive Design:** Pixel-perfect scaling from mobile devices to 4K displays using Tailwind CSS.
- **Interactive Particle Backgrounds:** A highly engaging, custom-built particle system acting as a dynamic backdrop.

### 🔐 Authentication & Profiles (Supabase)
- **Seamless Auth Flow:** Secure sign-in and session management utilizing Supabase Auth.
- **Dynamic User Profiles:** Users can set custom avatars and display names.
- **Discord Integration:** OAuth2 flow allowing users to link their Discord accounts. This syncs their store metadata (like total spent, orders, and "Elite" status) directly to Discord as Linked Roles.

### 💳 Automated E-Commerce & Payments
- **Stripe Integration:** Full checkout session handling via Stripe for instant balance top-ups and direct checkouts.
- **Wallet System:** A built-in virtual balance system allowing users to prepay and purchase items with zero friction.
- **Instant Delivery:** Webhooks listen for Stripe payments and instantly query the external provider API to deliver the digital good directly to the user's dashboard.

### 🛡️ Admin Panel & Security
- **Comprehensive Admin Dashboard:** Real-time analytics, revenue tracking, and order management.
- **Advanced Moderation:** Admins can flag, restrict, or globally ban users.
- **Global IP Ban Guard:** An advanced security layer that tracks IPs and cascades bans across all accounts associated with a malicious actor's IP address.
- **Security-First API:** Backend routes are strictly guarded with JWT validation and Row-Level Security (RLS) equivalents, preventing ID spoofing and unauthorized data access.

### 🔄 External API Orchestration
- **NFA Provider Integration:** Communicates with external third-party REST APIs to fetch, validate, and replace digital goods on the fly.
- **Warranty System:** Built-in logic to allow users to automatically request replacements for non-working digital goods within a specific time window.

## 🛠️ Tech Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Frontend:** React, Tailwind CSS, Lucide Icons, Sonner (Toasts)
- **Backend & Database:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments:** Stripe
- **Integrations:** Discord API, NFA REST API
- **Deployment:** Vercel (Recommended)

## 📂 Project Structure

```bash
├── src
│   ├── app               # Next.js App Router pages and API routes
│   │   ├── admin         # Secure Admin Dashboard
│   │   ├── api           # Backend Endpoints (Stripe webhooks, Discord OAuth, DB ops)
│   │   ├── dashboard     # User Dashboard (Orders, Profile, Security)
│   │   └── ...           
│   ├── components        # Reusable React components (Navbar, Hero, Modals)
│   └── lib               # Utility functions, API clients, and constants
├── scripts               # Automation scripts (Discord Bot, Database seeders)
└── public                # Static assets and imagery
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Project (URL & Anon/Service Keys)
- Stripe Account (Secret Key & Webhook Secret)
- Discord Developer Application (Client ID & Secret)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/r1k-k/larpsense-website.git
   cd larpsense-website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory based on `.env.example` (or configure your deployment environment) and include your Supabase, Stripe, and Discord keys.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔒 Security Practices Demonstrated
- **Zero Trust API:** All critical endpoints verify the user's JWT via Supabase rather than trusting client-provided IDs.
- **Data Sanitization:** Strict TypeScript interfaces and server-side validation to prevent malformed requests.
- **Secret Management:** Sensitive keys are strictly kept server-side. `.env` files and binaries are securely ignored via `.gitignore`.

---
*This project was created to demonstrate full-stack proficiency, combining a beautiful frontend with complex, secure backend logic.*
