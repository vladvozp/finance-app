# Klarsio — Budget & Finance Tracker

Klarsio is a modern web application for managing personal and household finances.

The project is developed as a practical portfolio application during my training as a **Fachinformatiker für Anwendungsentwicklung**.  
It focuses not only on the user interface, but also on financial logic, data structure, authentication, state management and long-term product development.

**Live Demo:** https://klarsio.de

---

## Project Status

### Current Stable Version: v0.4

Klarsio is currently available as version **v0.4**.

This version includes the core functionality of the application:

- transaction overview;
- income and expense management;
- category-based financial structure;
- financial summaries;
- dashboard foundation;
- Supabase database connection;
- authentication flow;
- responsive layout foundation.

The main goal of **v0.4** was to build a working and usable foundation for the application.

---

### In Development: v0.5

Version **v0.5** is currently in development.

The focus of this version is improving usability, transaction handling and the mobile experience.

Planned and ongoing improvements:

- improved transaction table;
- more compact mobile layout;
- better handling of transaction actions;
- safer cancellation logic instead of destructive deleting;
- improved UI and UX for daily usage;
- code cleanup and refactoring;
- preparation for more stable financial logic.

The goal of **v0.5** is to make Klarsio cleaner, more stable and easier to use in real everyday scenarios.

---

### Planned: v0.6 — Security & Engineering Update

Version **v0.6** is planned as a technical and engineering-focused update.

The main focus will be security, database structure and project quality.

Planned improvements:

- Supabase Row Level Security policies;
- user-based data access;
- improved database structure;
- basic audit log for important user actions;
- GitHub Actions CI pipeline;
- first automated tests for core financial logic;
- improved README and architecture documentation.

The goal of **v0.6** is to strengthen the technical foundation of Klarsio and make the project more suitable for portfolio presentation and technical interviews.

---

## Features

- Add and manage income transactions
- Add and manage expense transactions
- Categorize financial data
- View transaction history
- Display financial summaries
- Manage planned and recurring transactions
- Authentication and database persistence with Supabase
- Responsive design for desktop and mobile usage
- Safer transaction handling with cancellation logic instead of immediate deletion

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- Zustand

### Backend / Database

- Supabase
- PostgreSQL
- Supabase Auth

### Deployment

- Vercel

### Development Tools

- Git
- GitHub
- npm

---

## Technical Focus

Klarsio is not only a UI project.

The application is developed with a focus on real-world software engineering topics:

- financial data structure;
- user-based data handling;
- authentication;
- state management;
- database persistence;
- business logic for income, expenses and planning;
- clean UI structure;
- maintainability;
- future scalability.

---

## Roadmap

### v0.5 — Usability & Transaction Handling

- Improve transaction table
- Optimize mobile layout
- Refactor transaction actions
- Replace destructive delete behavior with safer cancellation logic
- Improve UI consistency
- Prepare financial logic for future features

### v0.6 — Security & Engineering

- Add Supabase Row Level Security
- Add user-based access policies
- Add basic audit log
- Add GitHub Actions build check
- Add first automated tests
- Improve technical documentation

### Future Ideas

- Excel / CSV export
- Advanced financial forecasting
- Monthly budget planning
- Better dashboard analytics
- Multi-user household budget mode
- AI-based financial insights

---

## Installation

```bash
git clone https://github.com/USERNAME/budget-tracker.git
cd budget-tracker
npm install
npm run dev