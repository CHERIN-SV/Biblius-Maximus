import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Profile implements OnInit {
  menuOpen = false;
  isEditing = false;
  userData = {
    name: '',
    email: '',
    image: '',
    dob: '',
    address: '',
    phone: ''
  };
  selectedImage = '';
  userEmail = '';
  message = '';
  messageColor = 'green';

  constructor(
    private router: Router,
    private firestore: Firestore,
    private auth: Auth
  ) {}

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
  ngOnInit(): void {
    onAuthStateChanged(this.auth, async (user) => {
      if (user?.email) {
        this.userEmail = user.email;
        const userRef = doc(this.firestore, 'users', this.userEmail);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data: any = userSnap.data();
          this.userData = {
            name: data.name || '',
            email: data.email || '',
            image: data.image || '',
            dob: data.dob || '',
            address: data.address || '',
            phone: data.phone || ''
          };
          this.selectedImage = this.userData.image || '';
        }
      }
    });
  }

  enableEdit(): void {
    this.isEditing = true;
    this.message = '';
  }

  async saveProfile(): Promise<void> {
    try {
      if (!this.userEmail) {
        this.showMessage('❌ Email is missing.', 'red');
        return;
      }

      const userRef = doc(this.firestore, 'users', this.userEmail);
      await updateDoc(userRef, {
        name: this.userData.name || '',
        email: this.userData.email || this.userEmail,
        image: this.selectedImage || '',
        dob: this.userData.dob || '',
        address: this.userData.address || '',
        phone: this.userData.phone || ''
      });

      this.isEditing = false;
      this.showMessage('✅ Profile updated successfully.', 'green');
    } catch (error) {
      console.error('Error saving profile:', error);
      this.showMessage('❌ Error saving profile.', 'red');
    }
  }

  logout(): void {
    signOut(this.auth)
      .then(() => {
        this.router.navigate(['']); // Use actual route, not `.component`
        alert('✅ Logout successful!');
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  }

    login(): void {
    signOut(this.auth)
      .then(() => {
        this.router.navigate(['/auth-page.component']); // Use actual route, not `.component`
        alert('✅ Welcome to login page');
      })
      .catch((error) => {
        console.error('Error logging in:', error);
      });
  }

   history(): void {
        this.router.navigate(['/history']); // Use actual route, not `.component`
        alert('✅ Welcome to your history');
  }


  onImageSelect(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput?.files?.length) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private showMessage(msg: string, color: string): void {
    this.message = msg;
    this.messageColor = color;
    setTimeout(() => (this.message = ''), 4000);
  }
}
