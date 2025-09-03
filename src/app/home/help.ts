import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore,getDoc,doc} from '@angular/fire/firestore';

@Component({
  selector: 'app-help',
  standalone: true,
  templateUrl: './help.html',
  styleUrls: ['./help.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HelpComponent {
  
  menuOpen = false;
  selectedImage = '';

  constructor(private router: Router,private firestore: Firestore, private auth: Auth) {}

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
        const userRef = doc(this.firestore, 'users', user.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data: any = userSnap.data();
          this.selectedImage = data.image || '';
        }
      }
    });
  }
}
