import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { onSnapshot,Firestore, collection, getDocs, doc, setDoc, updateDoc ,getDoc} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-products',
  standalone: true,
  templateUrl: './products.html',
  styleUrls: ['./products.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [FormsModule], 
})
export class Products implements OnInit {
  menuOpen = false;
  allBooks: any[] = [];
  filteredBooks: any[] = [];
  searchQuery: string = '';
  selectedImage = '';
  userEmail: string = '';

navigate(path: string) {
  // Navigate & close menu
  window.location.href = path; // Or use Angular Router: this.router.navigate([path]);
  this.menuOpen = false;
}


  constructor(private firestore: Firestore, private router: Router, private auth: Auth) {}

  ngOnInit(): void {
    this.fetchCategoriesAndBooks();
    onAuthStateChanged(this.auth, async (user) => {
      if (user?.email) {
         this.userEmail = user.email;
        const userRef = doc(this.firestore, 'users', user.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data: any = userSnap.data();
          this.selectedImage = data.image || '';
        }
      }
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  // 🔍 Updated search to query Firestore instead of filtering local array
  async searchBooksManual() {
    const inputElement = document.getElementById('searchInput') as HTMLInputElement;
    const query = inputElement.value.trim().toLowerCase();
    this.filteredBooks = [];

    if (!query) {
      this.renderBooks([], 'Please enter a search term');
      return;
    }

    const booksRef = collection(this.firestore, 'books');
    const categoryDocs = await getDocs(booksRef);

    for (const categoryDoc of categoryDocs.docs) {
      const subColRef = collection(this.firestore, `books/${categoryDoc.id}/Books`);
      const subColSnap = await getDocs(subColRef);

      subColSnap.forEach(bookDoc => {
        const bookData: any = bookDoc.data();
        const nameMatch = bookData.Name?.toLowerCase().includes(query);
        const authorMatch = bookData.Author?.toLowerCase().includes(query);

        if (nameMatch || authorMatch) {
          this.filteredBooks.push({
            ...bookData,
            bookId: bookDoc.id,
            category: categoryDoc.id
          });
        }
      });
    }

    this.renderBooks(this.filteredBooks, this.filteredBooks.length ? 'Search Results' : 'No Matches Found');
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

 async fetchCategoriesAndBooks(): Promise<void> {
  const booksRef = collection(this.firestore, 'books');

  onSnapshot(booksRef, (categoriesSnap) => {
    const categoryContainer = document.getElementById('categoryContainer');
    const booksDisplay = document.getElementById('booksDisplay');
    const allBooks: any[] = [];

    categoryContainer!.innerHTML = '';
    booksDisplay!.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.textContent = 'All';
    allBtn.style.cssText = this.buttonStyle();
    allBtn.onclick = () => this.renderBooks(allBooks, 'All');
    categoryContainer?.appendChild(allBtn);

    categoriesSnap.docs.forEach((catDoc) => {
      const category = catDoc.id;
      const subColRef = collection(this.firestore, `books/${category}/Books`);

      onSnapshot(subColRef, (booksSnap) => {
        const books: any[] = [];

        booksSnap.forEach((bookDoc) => {
          const book = bookDoc.data();
          if(book['Stock']>0){
          books.push({ ...book, bookId: bookDoc.id, category });
          allBooks.push({ ...book, bookId: bookDoc.id, category });
          }
        });

        const catBtn = document.createElement('button');
        catBtn.textContent = category;
        catBtn.style.cssText = this.buttonStyle();
        catBtn.onclick = () => this.renderBooks(books, category);
        categoryContainer?.appendChild(catBtn);

        this.allBooks = allBooks;
        this.renderBooks(allBooks, 'All');
      });
    });
  });
}

  renderBooks(books: any[], category: string): void {
    const booksDisplay = document.getElementById('booksDisplay');
    const container = document.getElementById('booksDisplay');
    if (!container) return;

    container.innerHTML = books.map(book => `
      <div style="background: white; padding: 1rem; border-radius: 10px; width: 200px; text-align: center;">
        <img src="${book.ImageURL}" style="width: 100%; border-radius: 8px;">
        <h3>${book.Name}</h3>
        <p>${book.Author}</p>
      </div>
    `).join('');
    
    booksDisplay!.innerHTML = '';

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
      image.src = book['Image'];
      image.alt = book['Name'];
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
      desc.textContent = book['Description'];
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
      name.textContent = book['Name'];

      const author = document.createElement('p');
      author.textContent = `Author: ${book['Author']}`;
      author.style.color = '#aaa';

      const ratingContainer = document.createElement('div');
      ratingContainer.style.cssText = 'margin: 0.5rem 0;';

      const currentRating = Math.round(book['Rating']);
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

      const stock = book['Stock'] || 0;
      const priceVal = stock > 5 ? book['Price'] : (stock > 0 ? book['Price'] : 0);

      const price = document.createElement('p');
      price.textContent = stock === 0 ? 'Out of Stock' : `Price: $${priceVal}`;
      price.style.color = stock === 0 ? 'red' : 'lime';

      const stockInfo = document.createElement('p');
      stockInfo.textContent = `Stock: ${stock}`;
      stockInfo.style.color = '#ff0';

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
    }// ← closes renderBooks
    
  }

  

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


    async placeOrder(book: any, category: string, bookId: string, price: number) {
  if (!this.userEmail) {
    alert('⚠️ You must be logged in to place an order.');
    return;
  }

  const orderId = Date.now().toString();
  const paymentMode = prompt('Choose Payment: Razorpay / GPay / COD') || 'COD';

  // 1️⃣ Add order to the global "order" collection
  const orderRef = doc(this.firestore, `order/${orderId}`);
  await setDoc(orderRef, {
    book: book['Name'],
    author: book['Author'],
    category,
    price,
    paymentMode,
    timestamp: new Date(),
    image: book['Image'] || book['ImageURL'] || ''
  });

  // 2️⃣ Decrease stock in global books collection
  const bookRef = doc(this.firestore, `books/${category}/Books/${bookId}`);
  const newStock = book['Stock'] - 1;
  await updateDoc(bookRef, { Stock: newStock });

  // 3️⃣ Add order to user's history collection AND decrease stock there as well
  const userHistoryRef = doc(this.firestore, `history/${this.userEmail}/Books/${bookId}`);
  await setDoc(userHistoryRef, {
    ...book,
    paymentMode,
    timestamp: new Date(),
    Stock: newStock // Update stock here too
  });

  alert(`Order placed for ${book['Name']} using ${paymentMode}. Remaining Stock: ${newStock}`);
  location.reload();
}



  async addToCart(book: any, category: string, bookId: string, price: number) {
    const cartId = Date.now().toString();
    const cartRef = doc(this.firestore, `cart/${cartId}`);

    await setDoc(cartRef, {
      book: book['Name'] || book['name'] || 'Untitled',
      author: book['Author'] || book['author'] || 'Unknown Author',
      category: category,
      price: price,
      bookId: bookId,
      image: book['Image'] || book['image'] || '',
      description: book['Description'] || book['description'] || 'No description available.',
      rating: book['Rating'] || book['rating'] || 0,
      addedAt: new Date()
    });

    alert(`${book['Name'] || book['name']} added to cart!`);
  }
}
