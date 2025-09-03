import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, collection, addDoc ,getDoc,doc} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact1.html',
  styleUrls: ['./contact1.scss'],
  imports: [CommonModule, FormsModule]
})
export class Contact1 {
  menuOpen = false;
  selectedImages = '';
  name: string = '';
  email: string = '';
  message: string = '';

  constructor(private router: Router, private firestore: Firestore, private auth: Auth) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  navigate(path: string) {
  // Navigate & close menu
  window.location.href = path; // Or use Angular Router: this.router.navigate([path]);
  this.menuOpen = false;
}

async ngOnInit() {
 onAuthStateChanged(this.auth, async (user) => {
      if (user?.email) {
        const userRef = doc(this.firestore, 'admin', user.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data: any = userSnap.data();
          this.selectedImages = data.image || '';
        }
      }
    });
  }
  async submitMessage(): Promise<void> {
    if (!this.name.trim() || !this.email.trim() || !this.message.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const contactRef = collection(this.firestore, 'contact-messages');
      await addDoc(contactRef, {
        name: this.name,
        email: this.email,
        message: this.message,
        timestamp: new Date()
      });

      alert(
        `✅ Message sent! 
        We’ve received your message, ${this.name}. 
        However, no email will be sent to your inbox unless Firebase Cloud Functions are configured.`
      );

      this.name = '';
      this.email = '';
      this.message = '';
    } catch (error) {
      console.error('Error saving message to Firestore:', error);
      alert('Something went wrong while submitting your message.');
    }
  }
}
