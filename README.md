# 🚀 Chai Code Playlist Booking (Backend Ninja Hackathon)

A full-stack, hybrid web application built to reserve seats for exclusive "Chai Aur Code" YouTube learning playlists. This project features a robust Express.js backend, a cloud-hosted PostgreSQL database (Neon), secure JWT authentication, and a sleek, responsive UI styled with Tailwind CSS.

Deployed live on [Vercel](https://vercel.com).

## ✨ Features

- **Secure Authentication:** Email-based registration and login system with password hashing (`bcrypt`) and JWT session management.
- **Real-Time Seat Booking:** Interactive grid of 48 seats. Visual indicators for available (green) vs. booked (red) seats.
- **Dynamic Course Selection:** Choose from four different coding playlists; the UI dynamically updates your selection.
- **Concurrency Protection:** Database-level locking (`FOR UPDATE`) prevents double-booking if two users try to book the exact same seat simultaneously.
- **Serverless Ready:** Optimized for Vercel deployment using standard ES modules and a custom `vercel.json` routing configuration.
- **Modern UI/UX:** Glassmorphism design, custom scrollbars, interactive modals, and smooth CSS transitions using Tailwind.

## 🛠️ Tech Stack

- **Frontend:** HTML5, Vanilla JavaScript, Tailwind CSS (CDN)
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Hosted on [Neon.tech](https://neon.tech))
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcrypt`
- **Deployment:** Vercel

## 📂 Project Structure

```text
book-my-ticket/
├── public/
│   └── images/              

├── src/
│   ├── config/
│   │   └── db.js            # Smart DB Pool (Local vs Cloud switching)
│   ├── features/
│   │   └── auth/
│   │       ├── auth.controller.js
│   │       ├── auth.model.js
│   │       ├── auth.routes.js
│   │       └── auth.service.js
│   └── middlewares/
│       └── authMiddleware.js # JWT verification
├── index.html               # Frontend UI
├── index.js                 # Express Entry Point
├── package.json
