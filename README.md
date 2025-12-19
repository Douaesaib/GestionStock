# GestionStock

GestionStock is a modern, mobile-first stock management and Point of Sale (POS) application built with React, Vite, and Firebase. It is designed to run on both web and mobile platforms (via Capacitor), featuring offline support and Bluetooth receipt printing.

## Features

- **Dashboard**: Real-time overview of stock, clients, daily sales, and profit.
- **Stock Management**: Add, edit, and delete products with tracking for buy/sell prices and stock levels.
- **Sales & POS**: 
  - Cart system with automatic subtotal and profit calculation.
  - Support for "Gros" (Wholesale) and "Detail" (Retail) pricing.
  - **Bluetooth Printing**: Print receipts directly to ESC/POS compatible thermal printers.
- **Client Management**: Manage client database.
- **Invoices & Returns**: Track sales history and handle product returns.
- **Offline Support**: Built-in Firebase persistence allows the app to function without an active internet connection.
- **Mobile Optimized**: Responsive UI designed for touch interfaces.

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS, Responsive Design
- **Backend / Database**: Firebase Firestore (with Offline Persistence)
- **Mobile / Native**: Capacitor (iOS & Android)
- **Hardware Integration**: `@capacitor-community/bluetooth-le` for printer communication

## Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn
- A Firebase project configured (see `src/firebase.ts`)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd GestionStock
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Ensure `src/firebase.ts` contains your valid Firebase configuration keys.

## Running the Application

### Web Development
To start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Mobile Development (Capacitor)
Sync the web assets with the native projects:
```bash
npm run build
npx cap sync
```

To open in Android Studio or Xcode:
```bash
npx cap open android
# or
npx cap open ios
```

## Building for Production

To create a production build:
```bash
npm run build
```
The output will be in the `dist` directory.

## Project Structure

- `src/App.tsx`: Main application logic, routing, and component definitions.
- `src/firebase.ts`: Firebase initialization and configuration.
- `src/App.css` & `src/index.css`: Global and component-level styles.
- `src/assets/`: Static assets (images, icons).

