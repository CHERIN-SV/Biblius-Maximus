import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {
  menuOpen = false;
  showTome = true; // Controls if Tome link is visible
  userEmail: string = '';
  userName: string = '';
  selectedImage = '';
user: any = null; 
  constructor(
    private router: Router,
    private firestore: Firestore,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    onAuthStateChanged(this.auth, async (user) => {
      if (user?.email) {
        this.userEmail = user.email;

        // ✅ load user profile image
        const userRef = doc(this.firestore, 'users', this.userEmail);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data: any = userSnap.data();
          this.selectedImage = data.image || '';
        }

        // ✅ check talismanic tome usage
        const tomeRef = doc(this.firestore, 'Talismanic-tome', this.userEmail);
        const tomeSnap = await getDoc(tomeRef);

        this.showTome = !tomeSnap.exists(); // false if already used
      } else {
        // not logged in yet → keep it visible so login flow works
        this.showTome = true;
      }
    });
  }

  goToTalismanicTome() {
    if (this.user) {
      // ✅ Already logged in → go directly
      this.router.navigate(['/talismanic-tome']);
    } else {
      // ❌ Not logged in → go to auth-page with a flag
      this.router.navigate(['/auth-page.component'], { queryParams: { from: 'tome' } });
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  navigate(path: string) {
    this.router.navigate([path]);
    this.menuOpen = false;
  }
}
