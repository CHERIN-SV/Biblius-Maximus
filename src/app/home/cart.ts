import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

interface Book {
  Name?: string;
  name?: string;
  book?: string;
  Book_Title?: string;
  bookId?: string;
  Author?: string;
  author?: string;
  Image?: string;
  image?: string;
  Description?: string;
  description?: string;
  Rating?: number | string;
  rating?: number | string;
  Price?: number | string;
  price?: number | string;
  category?: string;
  FromTalismanicTome?: boolean;
  fromTalismanicTome?: boolean;
  docId?: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CartComponent implements OnInit {
  menuOpen = false;
  selectedImage = '';
  orderedTitles: Set<string> = new Set();

  constructor(private router: Router, private firestore: Firestore,private auth: Auth)  {}

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
    
    const cartRef = collection(this.firestore, 'cart');
    const orderRef = collection(this.firestore, 'order');

    const [cartSnap, orderSnap] = await Promise.all([
      getDocs(cartRef),
      getDocs(orderRef)
    ]);

    const books: Book[] = [];

    orderSnap.forEach(orderDoc => {
      const data = orderDoc.data();
      const title = data['Name'] || data['name'] || data['book'];
      if (title) this.orderedTitles.add(title.toLowerCase());
    });

    for (const docSnap of cartSnap.docs) {
      const bookData = docSnap.data() as Book;
      const docRef = docSnap.ref;
      bookData.docId = docSnap.id;

      const name =
        bookData.Book_Title ||
        bookData.book ||
        bookData.name ||
        bookData.Name ||
        'Unknown';

      const category = bookData.category || '';
      const bookId = bookData.bookId || name;

      let needsUpdate = false;

      if ((!bookData.description && !bookData.Description) ||
          (!bookData.rating && !bookData.Rating)) {
        try {
          const bookDocRef = doc(this.firestore, `books/${category}/books/${bookId}`);
          const bookDocSnap = await getDoc(bookDocRef);

          if (bookDocSnap.exists()) {
            const extra = bookDocSnap.data() as Book;

            if (!bookData.description && !bookData.Description && extra.description) {
              bookData.description = extra.description;
              needsUpdate = true;
            }

            if (!bookData.rating && !bookData.Rating && extra.rating !== undefined) {
              bookData.rating = extra.rating;
              needsUpdate = true;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error fetching book from books/${category}/books/${bookId}`, error);
        }
      }

      if (needsUpdate) {
        try {
          await updateDoc(docRef, {
            description: bookData.description || '',
            rating: bookData.rating ?? 0
          });
        } catch (error) {
          console.warn(`⚠️ Failed to update cart item: ${docRef.id}`, error);
        }
      }

      books.push(bookData);
    }

    this.renderBooks(books, 'Cart');
  }

  async removeFromCart(docId: string) {
    try {
      await deleteDoc(doc(this.firestore, 'cart', docId));
      this.ngOnInit();
    } catch (error) {
      console.error('❌ Failed to remove item from cart:', error);
    }
  }

  renderBooks(books: Book[], category: string): void {
    const booksDisplay = document.getElementById('cartDisplay');
    if (!booksDisplay) return;

    booksDisplay.innerHTML = '';

    const catHeader = document.createElement('h2');
    catHeader.textContent = category.toUpperCase();
    catHeader.style.color = '#ffd700';
    catHeader.style.textAlign = 'center';  
    booksDisplay.appendChild(catHeader);

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.justifyContent = 'center';

    books.forEach(book => {
      const name = (book.Book_Title || book.Name || book.name || book.book || 'Unknown').trim();
      const author = (book.Author || book.author || 'N/A').trim();
      const imagePath = (book.Image || book.image || 'assets/placeholder.png').replace(/\\/g, '/');
      const description = (book.Description || book.description || 'No description available.').trim();
      const ratingValue = Number(book.Rating ?? book.rating ?? 0);
      const rating = isNaN(ratingValue) ? 0 : Math.min(Math.max(ratingValue, 0), 5);
      const price = Number(book.Price ?? book.price ?? 0);
      const isGift = price === 0;
      const isTalisman = book.FromTalismanicTome ?? book.fromTalismanicTome ?? false;
      const isOrdered = this.orderedTitles.has(name.toLowerCase());

      const bookBox = document.createElement('div');
      bookBox.style.cssText = `
        margin: 1rem;
        border: 1px solid #fff;
        padding: 1rem;
        border-radius: 10px;
        background: #111;
        color: white;
        max-width: 300px;
        text-align: center;
      `;

      const flipContainer = document.createElement('div');
      flipContainer.style.perspective = '1000px';

      const flipCard = document.createElement('div');
      flipCard.style.cssText = `
        width: 150px;
        height: 200px;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.8s;
        margin: auto;
        cursor: pointer;
      `;

      const flipFront = document.createElement('div');
      flipFront.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const image = document.createElement('img');
      image.src = imagePath;
      image.alt = name;
      image.style.width = '100px';
      flipFront.appendChild(image);

      const flipBack = document.createElement('div');
      flipBack.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        background-color: #222;
        color: white;
        transform: rotateY(180deg);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 15px;
        font-size: 0.85rem;
        text-align: justify;
        overflow: hidden;
        border-radius: 10px;
      `;

      const desc = document.createElement('p');
      desc.textContent = !isGift ? description : '🎁 This is your special gift!';
      desc.style.cssText = `
        overflow-y: auto;
        max-height: 100%;
        word-wrap: break-word;
        text-align: justify;
        margin: 0;
      `;
      flipBack.appendChild(desc);

      flipCard.onclick = () => {
        flipCard.style.transform = flipCard.style.transform === 'rotateY(180deg)' ? '' : 'rotateY(180deg)';
      };

      flipCard.append(flipFront, flipBack);
      flipContainer.appendChild(flipCard);

      const title = document.createElement('h4');
      title.textContent = name;
      title.style.cssText = `font-size: 1.1rem; color: #ffd700;`;

      const priceElem = document.createElement('p');
      priceElem.textContent = isGift ? '🎁 Gift Book' : `Price: $${price}`;
      priceElem.style.color = isGift ? 'gold' : 'lime';

      const type = document.createElement('p');
      if (isTalisman) {
        type.textContent = 'Talismanic Tome Gift';
        type.style.color = '#ff69b4';
      } else {
        type.textContent = isGift || isOrdered ? 'Purchased Book' : 'In Cart';
        type.style.color = isGift || isOrdered ? '#87cefa' : '#ffcc00';
      }

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove from Cart';
      removeBtn.style.cssText = `
        background-color: crimson;
        border: none;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      `;
      removeBtn.onclick = () => {
        if (book.docId) {
          this.removeFromCart(book.docId);
        }
      };

      bookBox.append(flipContainer, title);

      if (!isGift) {
        const authorElem = document.createElement('p');
        authorElem.textContent = `Author: ${author}`;
        authorElem.style.color = '#aaa';
        bookBox.appendChild(authorElem);

        const ratingContainer = document.createElement('div');
        ratingContainer.style.cssText = 'margin: 0.5rem 0;';
        for (let i = 1; i <= 5; i++) {
          const star = document.createElement('span');
          star.innerHTML = i <= rating ? '★' : '☆';
          star.style.cssText = `
            font-size: 1.2rem;
            color: ${i <= rating ? 'gold' : 'gray'};
            margin: 0 2px;
          `;
          ratingContainer.appendChild(star);
        }
        bookBox.appendChild(ratingContainer);
      }

      bookBox.append(priceElem, type, removeBtn);
      container.appendChild(bookBox);
    });

    booksDisplay.appendChild(container);
  }
}
