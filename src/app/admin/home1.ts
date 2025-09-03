import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

/* ✅ Pipe to safely render image URLs */
@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url: string | null): SafeUrl {
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : ('' as unknown as SafeUrl);
  }
}

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './home1.html',
  styleUrls: ['./home1.scss'],
  imports: [FormsModule, CommonModule, SafeUrlPipe]
})
export class home1 implements OnInit {
  // 🔹 Form fields
  categoryName = '';
  bookCategory = '';
  bookName = '';
  author = '';
  description = '';
  price: number | null = null;
  rating: number | null = null;
  stock: number | null = null;
  businessName: string = ''; // logged-in admin email
  selectedCategory: string = '';

  // 🔹 Image handling
  imageFile: File | null = null;
  imagePreview: string | null = null;
  imageUrl = '';

  // 🔹 Categories list (from Works only)
  categories: string[] = [];

  menuOpen = false;
  selectedImages = '';

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

  constructor(private firestore: Firestore, private http: HttpClient, private auth: Auth) {}

  async ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user?.email) {
        this.businessName = user.email;

        const userRef = doc(this.firestore, 'admin', user.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data: any = userSnap.data();
          this.selectedImages = data.image || '';
        }

        // ✅ Fetch categories only from Works/{businessName}/categories
        await this.fetchCategories();
      }
    });
  }

  /* ✅ Fetch categories from Works/{businessName}/categories */
  async fetchCategories() {
    if (!this.businessName) return;
    const snapshot = await getDocs(collection(this.firestore, `Works/${this.businessName}/categories`));
    this.categories = snapshot.docs.map(d => d.id);
  }

  /* ✅ Add new category (first in Works, then ensure it exists in books) */
  async addCategory() {
    if (!this.categoryName.trim() || !this.businessName) {
      alert('⚠️ Enter a category name');
      return;
    }

    try {
      // Step 1: Save inside Works/{businessName}/categories
      const worksCategoryRef = doc(
        this.firestore,
        `Works/${this.businessName}/categories/${this.categoryName}`
      );
      await setDoc(worksCategoryRef, { createdAt: new Date() });

      // Step 2: Ensure category also exists in books
      const booksCategoryRef = doc(this.firestore, 'books', this.categoryName);
      const booksSnap = await getDoc(booksCategoryRef);
      if (!booksSnap.exists()) {
        await setDoc(booksCategoryRef, {}); // create empty if missing
      }

      // Step 3: Inform Node server to create assets folder
      this.http.post('http://localhost:3000/create-category', { categoryName: this.categoryName })
        .subscribe({
          next: res => console.log('📂 Folder Response:', res),
          error: err => console.error('❌ Folder creation failed:', err)
        });

      this.categories.push(this.categoryName);
      alert(`✅ Category '${this.categoryName}' added!`);
      this.categoryName = '';
    } catch (err) {
      console.error('❌ Error adding category:', err);
      alert('Failed to add category');
    }
  }

  /* ✅ Select a category */
  selectCategory(cat: string) {
    this.bookCategory = cat;
    console.log('📚 Selected category:', this.bookCategory);
  }

  /* ✅ Select image */
  onImageSelect(event: any) {
    if (this.imagePreview) URL.revokeObjectURL(this.imagePreview);

    this.imageFile = event.target.files[0];
    if (this.imageFile) {
      this.imagePreview = URL.createObjectURL(this.imageFile);
    }
  }

  /* ✅ Upload image to Node server */
  async uploadImageToNode(): Promise<string> {
    if (!this.imageFile || !this.bookCategory) {
      console.error('⚠️ Missing file or category', this.imageFile, this.bookCategory);
      return '';
    }

    const formData = new FormData();
    formData.append('file', this.imageFile);
    formData.append('category', this.bookCategory);

    try {
      const res: any = await lastValueFrom(
        this.http.post(`http://localhost:3000/upload-book-image?category=${this.bookCategory}`, formData)
      );
      return `http://localhost:3000/${res.filePath}`;
    } catch (err) {
      console.error('❌ Upload failed:', err);
      return '';
    }
  }

  /* ✅ Add a new book (ensure category exists in Works & books) */
  async addBook() {
    if (!this.bookCategory || !this.bookName || !this.author || !this.description ||
        this.price == null || this.rating == null || this.stock == null || !this.imageFile) {
      alert('⚠️ Please fill in all fields and select an image.');
      return;
    }

    try {
      // Step 1: Upload image
      const uploadedUrl = await this.uploadImageToNode();
      if (!uploadedUrl) {
        alert('❌ Failed to upload image.');
        return;
      }
      this.imageUrl = uploadedUrl;

      // Step 2: Ensure category exists in Works
      const worksCategoryRef = doc(this.firestore, `Works/${this.businessName}/categories/${this.bookCategory}`);
      const worksSnap = await getDoc(worksCategoryRef);
      if (!worksSnap.exists()) {
        await setDoc(worksCategoryRef, { createdAt: new Date() });
      }

      // Step 3: Ensure category exists in books
      const booksCategoryRef = doc(this.firestore, 'books', this.bookCategory);
      const booksSnap = await getDoc(booksCategoryRef);
      if (!booksSnap.exists()) {
        await setDoc(booksCategoryRef, {});
      }

      // Step 4: Book data
      const bookData = {
        Name: this.bookName,
        Author: this.author,
        Description: this.description,
        Price: this.price,
        Rating: this.rating,
        Stock: this.stock,
        Image: this.imageUrl,
        FromTalismanicTome: false
      };

      // Save inside books collection
      const bookRef = doc(this.firestore, `books/${this.bookCategory}/Books`, this.bookName);
      await setDoc(bookRef, bookData);

      // Save inside Works/{businessName}/categories/{category}/Books
      const worksBookRef = doc(
        this.firestore,
        `Works/${this.businessName}/categories/${this.bookCategory}/Books`,
        this.bookName
      );
      await setDoc(worksBookRef, bookData);

      alert(`✅ '${this.bookName}' added to '${this.bookCategory}'.`);

      // Step 5: Reset form
      this.bookName = '';
      this.author = '';
      this.description = '';
      this.price = this.rating = this.stock = null;
      this.imageFile = null;
      this.imagePreview = null;
      this.imageUrl = '';

    } catch (err) {
      console.error('❌ Error adding book:', err);
      alert('Failed to add book');
    }
  }
}
