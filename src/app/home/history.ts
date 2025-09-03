import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { onSnapshot, Firestore, collection, getDocs, doc, setDoc, updateDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

interface BookHistory {
  address: string;
  author: string;
  book: string;
  bookId: string;
  category: string;
  description: string;
  email: string;
  image: string;
  name: string;
  paymentMode: string;
  price: number;
  quantity: number;
  status: string;
  timestamp?: { seconds: number; nanoseconds: number };
  transactionId: string;
 rating?: number;
  
  // Add these optional fields for rendering
  stock?: number;
}

@Component({
  selector: 'app-history',
  standalone: true,
  templateUrl: './history.html',
  styleUrls: ['./history.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [FormsModule],
})
export class History implements OnInit {
  menuOpen = false;
  allBooks: BookHistory[] = [];
  filteredBooks: BookHistory[] = [];
  searchQuery: string = '';
  selectedImage = '';
  userEmail: string = '';

  constructor(private firestore: Firestore, private router: Router, private auth: Auth) {}

  ngOnInit(): void {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user?.email) return;

      this.userEmail = user.email;

      const userRef = doc(this.firestore, 'users', this.userEmail);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data: any = userSnap.data();
        this.selectedImage = data.image || '';
      }

      // Load user's history books
      this.fetchHistoryBooks();
    });
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

  buttonStyle(): string {
    return `
      margin: 0.5rem;
      padding: 0.6rem 1.2rem;
      border-radius: 1rem;
      background-color: #ffd700;
      color: #000;
      border: none;
      font-weight: bold;
      cursor: pointer;
    `;
  }

  async searchBooksManual() {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredBooks = [];

    if (!query) {
      this.renderBooks([], 'Please enter a search term');
      return;
    }

    if (!this.userEmail) {
      alert('⚠️ You must be logged in to search your history.');
      return;
    }

    const subColRef = collection(this.firestore, `history/${this.userEmail}/Books`);
    const subColSnap = await getDocs(subColRef);

    subColSnap.forEach((bookDoc) => {
      const bookData = bookDoc.data() as BookHistory;
      if (bookData.book.toLowerCase().includes(query) || bookData.author.toLowerCase().includes(query)) {
        this.filteredBooks.push({ ...bookData, bookId: bookDoc.id });
      }
    });

    this.renderBooks(this.filteredBooks, this.filteredBooks.length ? 'Search Results' : 'No Matches Found');
  }

  async fetchHistoryBooks() {
  if (!this.userEmail) return;

  const booksRef = collection(this.firestore, `history/${this.userEmail}/Books`);

  onSnapshot(booksRef, async (booksSnap) => {
    const booksDisplay = document.getElementById('booksDisplay');
    const categoryContainer = document.getElementById('categoryContainer');
    if (!booksDisplay || !categoryContainer) return;

    const allBooks: BookHistory[] = [];
    booksDisplay.innerHTML = '';
    categoryContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.textContent = 'All';
    allBtn.style.cssText = this.buttonStyle();
    allBtn.onclick = () => this.renderBooks(allBooks, 'All');
    categoryContainer.appendChild(allBtn);

    // Use for...of for async fetching
    for (const docSnap of booksSnap.docs) {
      const bookHistory = docSnap.data() as BookHistory;

      // Fetch global book data for stock & rating
      const globalBookRef = doc(this.firestore, `books/${bookHistory.category}/Books/${bookHistory.bookId}`);
      const globalBookSnap = await getDoc(globalBookRef);

      let stock = 0;
      let rating = 0;

      if (globalBookSnap.exists()) {
        const globalBookData: any = globalBookSnap.data();
        stock = globalBookData.Stock || 0;
        rating = globalBookData.Rating || 0;
      }

      allBooks.push({
        ...bookHistory,
        bookId: docSnap.id,
         stock: stock,       // ✅ now allowed
         rating: rating 
      });
    }

    // Category buttons
    const categories = Array.from(new Set(allBooks.map((b) => b.category)));
    categories.forEach((cat) => {
      const catBtn = document.createElement('button');
      catBtn.textContent = cat;
      catBtn.style.cssText = this.buttonStyle();
      catBtn.onclick = () => this.renderBooks(allBooks.filter((b) => b.category === cat), cat);
      categoryContainer.appendChild(catBtn);
    });

    this.allBooks = allBooks;
    this.renderBooks(allBooks, 'All');
  });
}

// Inside History class, below renderBooks()

async updateRating(category: string, bookId: string, newRating: number) {
  try {
    // 1️⃣ Update rating in the user's history collection
    const userBookRef = doc(this.firestore, `history/${this.userEmail}/Books/${bookId}`);
    await updateDoc(userBookRef, { rating: newRating });

    // 2️⃣ Update rating in the global books collection
    const globalBookRef = doc(this.firestore, `books/${category}/Books/${bookId}`);
    await updateDoc(globalBookRef, { Rating: newRating });

    alert(`Rating updated to ${newRating} in both history and global books.`);
  } catch (err) {
    console.error(err);
    alert('Failed to update rating.');
  }
}


async addToCart(book: any, category: string, bookId: string, price: number) {
  try {
    const cartId = Date.now().toString();
    const cartRef = doc(this.firestore, `cart/${cartId}`);
    await setDoc(cartRef, {
      book: book.book || book.Name,
      author: book.author || book.Author,
      category: category,
      price: price,
      bookId: bookId,
      image: book.image || book.Image || book.ImageURL,
      description: book.description || book.Description,
      rating: book.rating || 0,
      addedAt: new Date(),
    });
    alert(`${book.book || book.Name} added to cart!`);
  } catch (err) {
    console.error(err);
    alert('Failed to add to cart.');
  }
}

  renderBooks(books: BookHistory[], category: string) {
    const booksDisplay = document.getElementById('booksDisplay');
    if (!booksDisplay) return;

    booksDisplay.innerHTML = '';

     const catHeader = document.createElement('h2');
    catHeader.textContent = category.toUpperCase();
    catHeader.style.color = '#22abfae1';
    catHeader.style.textAlign = 'center';
    catHeader.style.margin = '40px 0 20px 0';
    catHeader.style.display = 'block';
    catHeader.style.width = '100%';
    booksDisplay?.appendChild(catHeader);

    books.forEach(book => {
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

      bookBox.onclick = (event) => {
        const clickedInsideFlip = (event.target as HTMLElement).closest('.flip-card');
        if (clickedInsideFlip) return;

        this.router.navigate(['/book-detail'], {
          queryParams: {
            category: book.category,
            bookId: book.bookId
          }
        });
      };

      const flipContainer = document.createElement('div');
      flipContainer.style.perspective = '1000px';

      const flipCard = document.createElement('div');
      flipCard.className = 'flip-card';
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
      image.src = book['image'];
      image.alt = book['name'];
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
      desc.textContent = book['description'];
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

      flipCard.appendChild(flipFront);
      flipCard.appendChild(flipBack);
      flipContainer.appendChild(flipCard);

      const name = document.createElement('h4');
      name.textContent = book['book'];

      const author = document.createElement('p');
      author.textContent = `Author: ${book['author']}`;
      author.style.color = '#aaa';

      const ratingContainer = document.createElement('div');
      ratingContainer.style.cssText = 'margin: 0.5rem 0;';

      const currentRating = Math.round(book.rating ?? 0);

      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.innerHTML = i <= currentRating ? '★' : '☆';
        star.style.cssText = `
          font-size: 1.2rem;
          color: ${i <= currentRating ? 'gold' : 'gray'};
          cursor: pointer;
          margin: 0 2px;
        `;
        star.onclick = (e) => {
          e.stopPropagation();
          for (let j = 0; j < ratingContainer.children.length; j++) {
            ratingContainer.children[j].innerHTML = j < i ? '★' : '☆';
            (ratingContainer.children[j] as HTMLElement).style.color = j < i ? 'gold' : 'gray';
          }
          this.updateRating(book['category'], book['bookId'], i);
        };
        ratingContainer.appendChild(star);
      }

      const stock = book['stock'] || 0;
      const priceVal = stock > 5 ? book['price'] : (stock > 0 ? book['price'] : 0);

      const price = document.createElement('p');
      price.textContent = stock === 0 ? 'Out of Stock' : `Price: $${priceVal}`;
      price.style.color = stock === 0 ? 'red' : 'lime';

      const stockInfo = document.createElement('p');
      stockInfo.textContent = `Stock: ${stock}`;
      stockInfo.style.color = '#ff0';

      let timestamp: HTMLElement | null = null;

if (book['timestamp'] && book['timestamp'].seconds) {
  // Convert Firestore timestamp to JS Date
  const ts = new Date(book['timestamp'].seconds * 1000);

  timestamp = document.createElement('p');
  timestamp.textContent = `Purchased on: ${ts.toLocaleString()}`;
  timestamp.style.color = '#f0f5abff';
  timestamp.style.fontSize = '0.85rem';
  timestamp.style.marginTop = '5px';

  bookBox.appendChild(timestamp);
}


     const btn = document.createElement('button');
btn.textContent = 'Buy Now';
btn.disabled = stock === 0;

btn.onclick = async (e) => {
  e.stopPropagation();

  const user = this.auth.currentUser;
  if (!user) {
    // ❌ Not logged in → send them to auth-page
    // ✅ Pass a flag so after login we redirect correctly
    this.router.navigate(['/auth-page.component'], {
      queryParams: { 
        from: 'buy',              // 👈 flag for Buy Now
        category: book.category, 
        bookId: book.bookId 
      }
    });
    return;
  }

  // ✅ If logged in already → go directly
  this.router.navigate(['/buy-now'], {
    queryParams: { 
      category: book.category, 
      bookId: book.bookId 
    }
  });
};



      const addToCartBtn = document.createElement('button');
      addToCartBtn.textContent = 'Add to Cart';
      addToCartBtn.className = 'cart-button';
      addToCartBtn.disabled = stock === 0;
      addToCartBtn.onclick = (e) => {
        e.stopPropagation();
        this.addToCart(book, book['category'], book['bookId'], priceVal);
      };

      bookBox.append(flipContainer, name, author, ratingContainer, price, stockInfo, btn, addToCartBtn);
      booksDisplay?.appendChild(bookBox);
    });

    const booksSection: HTMLElement | null = document.getElementById('booksDisplay');
    if (booksSection) {
      booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

}}
