import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile1.html',
  styleUrls: ['./profile1.scss'],
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Profile1 implements OnInit {
  menuOpen = false;
  isEditing = false;
  adminData = {
    name: '',
    email: '',
    businessName: '',
    bookCategory: '',
    gstNumber: '',
    bankAccount: '',
    upiId: '',
    dob: '',
    address: '',
    phone: ''
  };
  selectedImages = '';
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
    window.location.href = path;
    this.menuOpen = false;
  }

  ngOnInit(): void {
    onAuthStateChanged(this.auth, async (user) => {
      if (user?.email) {
        this.userEmail = user.email;
        const adminRef = doc(this.firestore, 'admin', this.userEmail);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const data: any = adminSnap.data();
          this.adminData = {
            name: data.name || '',
            email: data.email || '',
            businessName: data.businessName || '',
            bookCategory: data.bookCategory || '',
            gstNumber: data.gstNumber || '',
            bankAccount: data.bankAccount || '',
            upiId: data.upiId || '',
            dob: data.dob || '',
            address: data.address || '',
            phone: data.phone || ''
          };
          this.selectedImages = data.image || '';
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

    // ✅ Correct path format
    const adminRef = doc(this.firestore, `admin/${this.userEmail}`);

    await updateDoc(adminRef, {
      name: this.adminData.name || '',
      email: this.adminData.email || this.userEmail,
      businessName: this.adminData.businessName || '',
      bookCategory: this.adminData.bookCategory || '',
      gstNumber: this.adminData.gstNumber || '',
      bankAccount: this.adminData.bankAccount || '',
      upiId: this.adminData.upiId || '',
      dob: this.adminData.dob || '',
      address: this.adminData.address || '',
      phone: this.adminData.phone || '',
      image: this.selectedImages || ''
    });

    this.isEditing = false;
    this.showMessage('✅ Admin profile updated successfully.', 'green');
  } catch (error: any) {
    console.error('Error saving profile:', error.message || error);
    this.showMessage('❌ Error saving profile: ' + (error.message || error), 'red');
  }
}


  logout(): void {
    signOut(this.auth)
      .then(() => {
        this.router.navigate(['admin']);
        alert('✅ Logout successful!');
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  }

  onImageSelect(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput?.files?.length) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImages = reader.result as string;
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
