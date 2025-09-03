import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';


@Injectable({
  providedIn: 'root'
})
export class TalismanicTomeGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      this.router.navigate(['/home']);
      return false;
    }

    const userEmail = user.email ?? '';
    const tomeRef = doc(this.firestore, 'Talismanic-tome', userEmail);
    const docSnap = await getDoc(tomeRef);

    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      const lastOpened = new Date(data.openDate);

      if (
        lastOpened.getMonth() === thisMonth &&
        lastOpened.getFullYear() === thisYear
      ) {
        alert('You have already opened this month\'s Talismanic Tome 🎁. Come back next month!');
        this.router.navigate(['/home']);
        return false;
      }
    }

    return true;
  }
}
