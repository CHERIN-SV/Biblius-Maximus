import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, addDoc, doc, getDoc, getDocs, setDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import jsPDF from 'jspdf';

@Component({
  standalone: true,
  selector: 'app-talismanic-tome',
  templateUrl: './talismanic-tome.html',
  styleUrls: ['./talismanic-tome.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TalismanicTomeComponent implements OnInit {
  menuOpen = false;
  messageShown = false;
  bookSelected = false;
  selectedBookImage = '';
  selectedBookTitle = '';
  nextOfferDate = '';
  userEmail = '';
  userName = '';
  giftBooks: any[] = [];
  selectedImage = '';

navigate(path: string) {
  // Navigate & close menu
  window.location.href = path; // Or use Angular Router: this.router.navigate([path]);
  this.menuOpen = false;
}

  firestore = inject(Firestore);
  auth = inject(Auth);

  constructor(private router: Router) {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) return;

      this.userEmail = user.email ?? '';
      const tomeRef = doc(this.firestore, 'Talismanic-tome', this.userEmail);
      const tomeSnap = await getDoc(tomeRef);

      if (tomeSnap.exists()) {
        alert('You have already opened your Talismanic Tome. Redirecting...');
        this.router.navigate(['']);
      }

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

  async ngOnInit() {
    alert('Rotate or move your screen and choose your Talismanic Tome !');
    const giftBooksCollection = collection(this.firestore, 'Gift Books');
    const snapshot = await getDocs(giftBooksCollection);
    this.giftBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Dynamically add <img> tags to <a-assets> for A-Frame compatibility
    this.giftBooks.forEach((book, index) => {
      const img = document.createElement('img');
      img.setAttribute('id', `book${index + 1}Img`);
      img.setAttribute('src', book.Image.replace(/\\/g, '/'));  // Fix slashes
      img.setAttribute('crossorigin', 'anonymous');
      document.querySelector('a-assets')?.appendChild(img);
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  async selectBook(book: any, index: number): Promise<void> {
    if (this.bookSelected) return;

    this.selectedBookTitle = book.Name;
    this.selectedBookImage = book.Image;
    this.messageShown = true;
    this.bookSelected = true;

    const user = this.auth.currentUser;
    if (!user) return;

    const userDocRef = doc(this.firestore, `users/${this.userEmail}`);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      console.error('User data not found in Firestore.');
      return;
    }

    const userData = userSnapshot.data() as { name: string; email: string };
    this.userName = userData.name;
    this.userEmail = userData.email;

    const giftData = {
      User: this.userName,
      Email: this.userEmail,
      book: this.selectedBookTitle,
      Date_Opened: new Date(),
      Image: this.selectedBookImage
    };

    const tomeRef = doc(this.firestore, 'Talismanic-tome', this.userEmail);

    try {
      await setDoc(tomeRef, giftData);
      console.log('🎁 Gift saved for', this.userEmail);

      const cartRef = collection(this.firestore, 'cart');
      const cartEntry = {
        user: this.userName,
        email: this.userEmail,
        book: this.selectedBookTitle,
        price: 0,
        quantity: 1,
        addedAt: new Date(),
        Image: this.selectedBookImage
      };
      await addDoc(cartRef, cartEntry);
      console.log('🛒 Gifted book added to cart');
    } catch (err) {
      console.error('❌ Firestore error:', err);
    }

    // Set image to the book plane
    const bookPlane = document.querySelector(`#book${index + 1}`);
    const assetId = `#book${index + 1}Img`;
    if (bookPlane) {
      (bookPlane as any).setAttribute('material', `src: ${assetId}; shader: flat; transparent: true`);
    }
  }


  
  getPlanePosition(index: number): string {
    const positions = ['-10 1 2', '0 1 -4', '10 1 2', '-10 3 -2', '10 3 -2', '0 3 4'];
    return positions[index % positions.length];
  }

  getPlaneRotation(index: number): string {
    if (index % 3 === 0) return '0 90 10';
    if (index % 3 === 2) return '0 -90 -10';
    return '0 0 0';
  }

async downloadPDF(): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const marginX = 20;

  // Header
  pdf.setFillColor(255, 230, 240); // light pink
  pdf.rect(0, 0, 210, 35, 'F');
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(80, 0, 60);
  pdf.text("Biblius Maximus", 105, 20, { align: "center" });

  // Company Name
  pdf.setFontSize(12);
  pdf.setTextColor(60, 60, 60);
  pdf.text("TALISMANIC TOME GIFT RECEIPT", 105, 28, { align: "center" });

  // Gift & User Info
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  const today = new Date().toLocaleDateString();
  const receiptNum = Math.floor(100000 + Math.random() * 900000);

  pdf.text(`Receipt #: ${receiptNum}`, marginX, 45);
  pdf.text(`Date: ${today}`, 150, 45);
  pdf.text(`Name: ${this.userName}`, marginX, 52);
  pdf.text(`Email: ${this.userEmail}`, marginX, 58);

  // Table Header
  pdf.setFillColor(255, 100, 130);
  pdf.setTextColor(255);
  pdf.setFont("helvetica", "bold");
  pdf.rect(marginX, 70, 170, 10, 'F');
  pdf.text("SL", marginX + 2, 77);
  pdf.text("Book Title", marginX + 20, 77);
  pdf.text("Price", 160, 77);
  pdf.text("Qty", 180, 77);

  // Book Row
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0);
  pdf.text("1", marginX + 2, 87);
  pdf.text(this.selectedBookTitle, marginX + 20, 87);
  pdf.text("$0.00", 160, 87);
  pdf.text("1", 182, 87);

  // Totals
  pdf.setFont("helvetica", "bold");
  pdf.text("Subtotal:", 150, 105);
  pdf.text("$0.00", 180, 105);
  pdf.text("Tax:", 150, 112);
  pdf.text("$0.00", 180, 112);
  pdf.setTextColor(255, 0, 0);
  pdf.text("TOTAL:", 150, 122);
  pdf.text("$0.00", 180, 122);
  pdf.setTextColor(0);


  // Signature
  pdf.setFont("helvetica", "bolditalic");
  pdf.text("Delight in the Talismanic Tome — more than a gift, it's a gateway to wisdom, cloaked in digital magic.", marginX, 160);

  // 🖋 Footer Stripe
  pdf.setFillColor(255, 230, 240);
  pdf.rect(0, 285, 210, 12, 'F');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(9);
  pdf.text("Thank you for choosing Biblius Maximus!", 105, 292, { align: "center" });

  // Save PDF
  pdf.save("gift_receipt.pdf");
}

}
