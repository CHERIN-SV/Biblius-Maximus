import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { initializeApp } from '@angular/fire/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, Auth } from '@angular/fire/auth';
import { getFirestore, Firestore, doc, setDoc ,getDoc} from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class Admin {
  isLoginMode = true;

  // Entrepreneur personal details
  name = '';
  phone = '';
  dob = '';
  address = '';
  email = '';
  password = '';

  // Entrepreneur business details
  businessName = '';
  gstNumber = '';
  bankAccount = '';
  upiId = '';
  website = '';
  bookCategory = '';

  // Captcha
  captcha = '';
  enteredCaptcha = '';

  // Terms
  acceptedTerms = false;

  navigateToUser() {
    this.router.navigate(['']);
  }

  auth: Auth;
  firestore: Firestore;
  private router = inject(Router);

  constructor() {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);
    this.firestore = getFirestore(app);
    this.generateCaptcha();
  }

  forgotPassword() {
    if (!this.email) {
      alert('Please enter your email to reset password.');
      return;
    }
    sendPasswordResetEmail(this.auth, this.email)
      .then(() => {
        alert('📧 Password reset email sent! Check your inbox.');
      })
      .catch((error) => {
        alert('Error sending password reset email: ' + error.message);
      });
  }

  generateCaptcha() {
    this.captcha = Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async submit() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (this.isLoginMode) {
      if (!this.email || !this.password) {
        alert('⚠️ Please fill in all required fields.');
        return;
      }
      if (!emailRegex.test(this.email)) {
        alert('❌ Please enter a valid email address.');
        return;
      }
    } else {
      if (!this.name || !this.phone || !this.dob || !this.address || !this.email || !this.password || !this.enteredCaptcha ||
          !this.businessName || !this.gstNumber || !this.bankAccount || !this.upiId || !this.bookCategory) {
        alert('⚠️ Please fill in all fields.');
        return;
      }
      if (!emailRegex.test(this.email)) {
        alert('❌ Invalid email format.');
        return;
      }
      if (!phoneRegex.test(this.phone)) {
        alert('❌ Phone number must be exactly 10 digits.');
        return;
      }
      if (this.enteredCaptcha !== this.captcha) {
        alert('❌ Captcha is incorrect. Try again.');
        this.generateCaptcha();
        return;
      }
      if (!this.acceptedTerms) {
        alert('⚠️ Please accept the Terms & Conditions before registering.');
        return;
      }
    }

    try {
      if (this.isLoginMode) {
  try {
    // 🔹 Step 1: Check if email exists in admin database
    const adminRef = doc(this.firestore, `admin/${this.email}`);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      alert('❌ Access denied. This email is not registered as an admin.');
      return;
    }

    // 🔹 Step 2: Proceed with Firebase Auth login
    await signInWithEmailAndPassword(this.auth, this.email, this.password);
    alert('✅ Login successful!');
    this.router.navigate(['/home1']);

  } catch (error: any) {
    console.error('Login error:', error);
    alert('⚠️ ' + error.message);
  }
}
 else {
        const userCredential = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
        const uid = userCredential.user.uid;

        // Save entrepreneur data to Firestore
        const userRef = doc(this.firestore, `admin/${this.email}`);
        await setDoc(userRef, {
          name: this.name,
          phone: this.phone,
          dob: this.dob,
          address: this.address,
          email: this.email,
          businessName: this.businessName,
          gstNumber: this.gstNumber,
          bankAccount: this.bankAccount,
          upiId: this.upiId,
          bookCategory: this.bookCategory,
          createdAt: new Date()
        });

        alert('✅ Registration successful as Entrepreneur!');
        this.router.navigate(['/home1']);
      }
    } catch (err: any) {
      alert('❌ ' + err.message);
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.generateCaptcha();
  }
}
