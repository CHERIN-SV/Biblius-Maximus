# 📚 Biblius-Maximus

**Biblius Maximus** is an immersive **book-commerce virtual reality (VR) application** built with:  
- **Angular** (Frontend)  
- **A-Frame** (VR & 3D Interaction)  
- **Firebase** (Authentication, Firestore Database, Hosting)  
- **SCSS** (Modern styling)  

It combines **online book shopping** with **virtual reality**, giving users the experience of walking through a library, picking books, and buying them with multiple payment options.  

---

## ✨ Features

### 🔑 Authentication
- User registration and login with Firebase Authentication.  
- Profile management with custom profile pictures or emojis.  
- Password reset and language preferences.  

### 👤 Profile Page
- Modern mobile-style UI with sections: **My Profile, My Orders, Refund, Change Password, Change Language**.  
- Editable details (name, email, address, profile image).  
- Fixed animated background (gif-based).  

### 📚 Products & Virtual Library
- Interactive **3D book browsing** using A-Frame VR.  
- Each book displays:
  - Image  
  - Title & Author  
  - Description (animated page-turn effect when clicked)  
  - Rating (star-based, dynamic)  
  - Price (removed if out of stock)  
- Responsive design with VR background and hamburger menu for mobile.  

### 🛒 Cart
- Add to Cart & Remove from Cart with Firestore sync.  
- Displays book image, title, author, rating, price, and type (Purchased/Gift).  
- Supports both **regular books** and **gift books (Talismanic Tome)**.  

### 🎁 Talismanic Tome (Gift Feature)
- Monthly free book offer displayed as floating VR books.  
- Once a user picks a gift, a message appears:  
  _"Your present is ready for you. Happy reading!"_  
- Selected gift book is added to the cart with **$0 cost**.  
- Stored in Firestore with fields: `Book_Title, Date_Opened, Email, Name`.  

### 💳 Payments
- Multiple payment options:
  - Razorpay  
  - Google Pay (with dynamic QR code reflecting total amount, user name & address)  
  - Cash on Delivery (COD)  
- Order & payment details stored in Firestore.  

### 📑 Orders & Receipts
- Orders saved with **book details, user info, payment mode, quantity, date, transaction ID**.  
- Receipts generated using **html2canvas + jsPDF**.  
- Styled like a corporate invoice (tabular layout, doodle background, theme colors).  
- Option to download as PDF.  

### 🔍 Browse Categories
- Books are structured in Firestore:  
  - `books` (main collection)  
    - Each category is a document  
      - `books` subcollection → each book as a document  
- Clicking a category button loads books dynamically with stock & price updates.  

---

## 🗄️ Firestore Database Structure

```plaintext
Firestore Root
│
├── users (collection)
│   └── {userId} (document)
│       ├── name
│       ├── email
│       ├── address
│       ├── image (profile picture path/emoji)
│       └── language
│
├── books (collection)
│   └── {categoryName} (document)
│       └── books (subcollection)
│           └── {bookId} (document)
│               ├── title
│               ├── author
│               ├── description
│               ├── image
│               ├── price
│               ├── rating
│               └── stock
│
├── cart (collection)
│   └── {userId_bookId} (document)
│       ├── userId
│       ├── bookId
│       ├── title
│       ├── author
│       ├── image
│       ├── price
│       └── type (Purchased / Gift)
│
├── orders (collection)
│   └── {orderId} (document)
│       ├── userId
│       ├── books (array of ordered books)
│       ├── totalAmount
│       ├── paymentMode
│       ├── transactionId
│       ├── date
│       └── address
│
└── Talismanic-tome (collection)
    └── {tomeId} (document)
        ├── Book_Title
        ├── Date_Opened (timestamp)
        ├── Email
        └── Name


📘 Developer Guide
🚀 Development Server
ng serve


Navigate to http://localhost:4200

The app reloads automatically when files change.

🛠️ Code Scaffolding
ng generate component component-name


For a full list of schematics:

ng generate --help

📦 Building
ng build


Artifacts will be stored in the dist/ directory.

✅ Running Unit Tests
ng test

🔎 Running End-to-End Tests
ng e2e


⚠️ Angular CLI does not include an e2e framework by default. Use Cypress, Protractor, or Playwright.

📚 Additional Resources

Angular CLI Documentation

Firebase Documentation

A-Frame VR Documentation

SCSS Documentation

📧 Contact

📩 Email: cherinpappu207@gmail.com

✨ Step into the future of book shopping with Biblius Maximus – where VR meets e-commerce!
