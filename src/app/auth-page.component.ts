import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { initializeApp } from '@angular/fire/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, Auth } from '@angular/fire/auth';
import { getFirestore, Firestore, doc, setDoc ,getDoc} from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.scss']
})
export class AuthPageComponent implements OnInit {
  isLoginMode = true;

  name = '';
  phone = '';
  dob = '';
  address = '';
  email = '';
  password = '';
  captcha = '';
  enteredCaptcha = '';

  auth: Auth;
  firestore: Firestore;
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // query params
  from: string | null = null;
  category: string | null = null;
  bookId: string | null = null;

  constructor() {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);
    this.firestore = getFirestore(app);
    this.generateCaptcha();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.from = params['from'] || null;
      this.category = params['category'] || null;
      this.bookId = params['bookId'] || null;
    });
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
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
      if (!this.name || !this.phone || !this.dob || !this.address || !this.email || !this.password || !this.enteredCaptcha) {
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
    }

    try {
      if (this.isLoginMode) {
        // ✅ Step 1: Sign in
        const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
        const user = userCredential.user;

        // ✅ Step 2: Firestore check
        const userRef = doc(this.firestore, 'users', this.email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          alert('✅ Login successful!');

          // ✅ Redirect depending on where login came from
          if (this.from === 'tome') {
            this.router.navigate(['/talismanic-tome']);
          } else if (this.from === 'buy') {
            this.router.navigate(['/buy-now'], {
              queryParams: {
                category: this.category,
                bookId: this.bookId
              }
            });
          } else {
            this.router.navigate(['/']);
          }

        } else {
          alert('⚠️ Your account exists in Auth but not in user database!');
        }
      } else {
        // ✅ Registration
        const userCredential = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
        const uid = userCredential.user.uid;

        const userRef = doc(this.firestore, `users/${this.email}`);
        await setDoc(userRef, {
          name: this.name,
          phone: this.phone,
          dob: this.dob,
          address: this.address,
          email: this.email,
          createdAt: new Date()
        });

        alert('✅ Registration successful!');
        this.router.navigate(['/']);
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
