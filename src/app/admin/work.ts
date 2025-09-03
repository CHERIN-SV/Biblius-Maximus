import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { onSnapshot, Firestore, collection, getDocs, doc, setDoc, updateDoc, getDoc,deleteDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-products',
  standalone: true,
  templateUrl: './work.html',
  styleUrls: ['./work.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [FormsModule],
})
export class work implements OnInit {
  menuOpen = false;
  allBooks: any[] = [];
  filteredBooks: any[] = [];
  searchQuery: string = '';
  selectedImages = '';
  businessName: string = '';   // email from admin db
  bookCategory: string = '';   // category chosen

  constructor(private firestore: Firestore, private router: Router, private auth: Auth) {}

  ngOnInit(): void {
    // 🔑 Get logged-in admin email → Works/{businessName}
    onAuthStateChanged(this.auth, async (user) => {
      if (user?.email) {
        const adminRef = doc(this.firestore, 'admin', user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          const data: any = adminSnap.data();
          this.selectedImages = data.image || '';
          this.businessName = user.email;   // ✅ use logged-in admin email as businessName
          this.fetchCategoriesAndBooks();   // load books once businessName is set
        }
      }
    });
  }

  
    // ✨ Edit book modal
openEditModal(book: any) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); display: flex; justify-content: center; 
    align-items: center; z-index: 1000;
  `;

  const form = document.createElement('div');
  form.style.cssText = `
    background: #111; padding: 20px; border-radius: 10px; 
    max-width: 500px; width: 100%; color: white;
    max-height: 90vh; overflow-y: auto; position: relative;
  `;

  // ❌ Close Button
  const closeBtn = document.createElement('button');
  closeBtn.innerText = "✖";
  closeBtn.style.cssText = `
    position:absolute; top:10px; right:10px;
    background:red; color:white; border:none;
    border-radius:50%; width:30px; height:30px; cursor:pointer;
  `;
  closeBtn.onclick = () => modal.remove();

  // Heading
  const heading = document.createElement('h2');
  heading.innerText = "EDIT BOOK";
  heading.style.cssText = `
    text-align:center; margin-bottom:15px; color:#22abfa;
    position:sticky; top:0; background:#111; padding:10px; z-index:5;
  `;

  // Input builder
  const createInput = (label: string, value: string, type = 'text') => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '10px';

    const lbl = document.createElement('label');
    lbl.innerText = label;
    lbl.style.display = 'block';
    lbl.style.marginBottom = '5px';

    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.style.cssText = `width:100%; padding:8px; border-radius:5px; border:none;`;

    wrapper.append(lbl, input);
    return { wrapper, input };
  };

  // Fields
  const nameField = createInput("Name", book.Name);
  const authorField = createInput("Author", book.Author);
  const priceField = createInput("Price", book.Price, "number");
  const ratingField = createInput("Rating", book.Rating, "number");
  const stockField = createInput("Stock", book.Stock, "number");

  // Description
  const descWrapper = document.createElement('div');
  descWrapper.style.marginBottom = '10px';
  const descLabel = document.createElement('label');
  descLabel.innerText = "Description";
  const descInput = document.createElement('textarea');
  descInput.value = book.Description;
  descInput.style.cssText = `width:100%; padding:8px; border-radius:5px;`;
  descWrapper.append(descLabel, descInput);

  // Image
  const imgWrapper = document.createElement('div');
  imgWrapper.style.marginBottom = '10px';
  const imgLabel = document.createElement('label');
  imgLabel.innerText = "Image ";
  const imgInput = document.createElement('input');
  imgInput.type = "file";
  imgInput.accept = "image/*";
  imgWrapper.append(imgLabel, imgInput);

  // Buttons
  const btnWrapper = document.createElement('div');
  btnWrapper.style.cssText = `
    display:flex; justify-content:flex-end; gap:10px; margin-top:15px;
  `;

  const cancelBtn = document.createElement('button');
  cancelBtn.innerText = "Cancel";
  cancelBtn.style.cssText = `
    background:#444; color:white; padding:8px 15px;
    border:none; border-radius:5px; cursor:pointer;
  `;
  cancelBtn.onclick = () => modal.remove();

  const saveBtn = document.createElement('button');
  saveBtn.innerText = "Save";
  saveBtn.style.cssText = `
    background:#22abfa; color:white; padding:8px 15px;
    border:none; border-radius:5px; cursor:pointer;
  `;
  saveBtn.onclick = async () => {
    let imageUrl = book.Image;

    if (imgInput.files && imgInput.files[0]) {
      // ✅ Upload to server.js
      const formData = new FormData();
      formData.append("file", imgInput.files[0]);
      formData.append("category", book.category);

      const res = await fetch(`http://localhost:3000/upload-book-image?category=${book.category}`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.filePath) {
        imageUrl = `http://localhost:3000/${data.filePath}`;
      }
    }

    const updatedBook = {
      Name: nameField.input.value,
      Author: authorField.input.value,
      Description: descInput.value,
      Price: parseFloat(priceField.input.value),
      Rating: parseFloat(ratingField.input.value),
      Stock: parseInt(stockField.input.value),
      Image: imageUrl
    };

    // ✅ Update Works DB
    // ✅ Update Works DB
const bookRef = doc(this.firestore, `Works/${this.businessName}/categories/${book.category}/Books/${book.bookId}`);
await updateDoc(bookRef, updatedBook);

// ✅ Update Books DB (fix: use "Books" not "books")
const globalRef = doc(this.firestore, `books/${book.category}/Books/${book.bookId}`);
await updateDoc(globalRef, updatedBook);


    alert("Book updated successfully!");
    modal.remove();
  };

  btnWrapper.append(cancelBtn, saveBtn);
  form.append(closeBtn, heading, nameField.wrapper, authorField.wrapper, descWrapper,
    priceField.wrapper, ratingField.wrapper, stockField.wrapper, imgWrapper, btnWrapper);
  modal.appendChild(form);
  document.body.appendChild(modal);
}




  async deleteBook(book: any) {
    if (!confirm(`Are you sure you want to delete "${book.Name}"?`)) return;

    // Delete from Works
    const worksRef = doc(this.firestore, `Works/${this.businessName}/categories/${book.category}/Books/${book.bookId}`);
    await deleteDoc(worksRef);

    // Delete from Global books
    const booksRef = doc(this.firestore, `books/${book.category}/Books/${book.bookId}`);
    await deleteDoc(booksRef);

    alert("🗑️ Book deleted successfully!");
  }


  navigate(path: string) {
    this.router.navigate([path]);
    this.menuOpen = false;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
  closeMenu(): void {
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

  // 🔍 Manual search inside Works/{businessName}/categories/.../Books
  async searchBooksManual() {
    if (!this.businessName) return;

    const inputElement = document.getElementById('searchInput') as HTMLInputElement;
    const query = inputElement.value.trim().toLowerCase();
    this.filteredBooks = [];

    if (!query) {
      this.renderBooks([], 'Please enter a search term');
      return;
    }

    const categoriesRef = collection(this.firestore, `Works/${this.businessName}/categories`);
    const categoryDocs = await getDocs(categoriesRef);

    for (const categoryDoc of categoryDocs.docs) {
      const subColRef = collection(this.firestore, `Works/${this.businessName}/categories/${categoryDoc.id}/Books`);
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

  // 📚 Fetch categories + books from Works/{businessName}/categories/{category}/Books
  async fetchCategoriesAndBooks(): Promise<void> {
    if (!this.businessName) return;

    const categoriesRef = collection(this.firestore, `Works/${this.businessName}/categories`);

    onSnapshot(categoriesRef, (categoriesSnap) => {
      const categoryContainer = document.getElementById('categoryContainer');
      const booksDisplay = document.getElementById('booksDisplay');
      const allBooks: any[] = [];

      if (!categoryContainer || !booksDisplay) return;

      categoryContainer.innerHTML = '';
      booksDisplay.innerHTML = '';

      // "All" button
      const allBtn = document.createElement('button');
      allBtn.textContent = 'All';
      allBtn.style.cssText = this.buttonStyle();
      allBtn.onclick = () => this.renderBooks(allBooks, 'All');
      categoryContainer.appendChild(allBtn);

      categoriesSnap.docs.forEach((catDoc) => {
        const category = catDoc.id;
        const subColRef = collection(this.firestore, `Works/${this.businessName}/categories/${category}/Books`);

        onSnapshot(subColRef, (booksSnap) => {
          const books: any[] = [];

          booksSnap.forEach((bookDoc) => {
            const book = bookDoc.data();
            if (book['Stock'] > 0) {
              books.push({ ...book, bookId: bookDoc.id, category });
              allBooks.push({ ...book, bookId: bookDoc.id, category });
            }
          });

          // category button
          const catBtn = document.createElement('button');
          catBtn.textContent = category;
          catBtn.style.cssText = this.buttonStyle();
          catBtn.onclick = () => this.renderBooks(books, category);
          categoryContainer.appendChild(catBtn);

          this.allBooks = allBooks;
          this.renderBooks(allBooks, 'All');
        });
      });
    });
  }

  // ✅ Rating update (Works db only)
  async updateRating(category: string, bookId: string, newRating: number) {
    const bookRef = doc(this.firestore, `Works/${this.businessName}/categories/${category}/Books/${bookId}`);
    await updateDoc(bookRef, { Rating: newRating });
    alert(`Rating updated to ${newRating}`);
  }

  
  
  // ⚡ Your existing renderBooks() logic stays here
  renderBooks(books: any[], category: string): void {
  const booksDisplay = document.getElementById('booksDisplay');
  if (!booksDisplay) return;

  booksDisplay.innerHTML = '';

  // Category header
  const catHeader = document.createElement('h2');
  catHeader.textContent = category.toUpperCase();
  catHeader.style.color = '#22abfae1';
  catHeader.style.textAlign = 'center';
  catHeader.style.margin = '40px 0 20px 0';
  catHeader.style.display = 'block';
  catHeader.style.width = '100%';
  booksDisplay.appendChild(catHeader);

  // Render each book
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

    // Navigate to detail page (only when not clicking on flip card)
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

    // Flip card setup
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

    // Front
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
    image.src = book['Image'] || '';
    image.alt = book['Name'] || 'Book';
    image.style.width = '100px';
    flipFront.appendChild(image);

    // Back
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
    desc.textContent = book['Description'] || 'No description available';
    desc.style.cssText = `
      overflow-y: auto;
      max-height: 100%;
      word-wrap: break-word;
      text-align: justify;
      margin: 0;
    `;
    flipBack.appendChild(desc);

    flipCard.onclick = () => {
      flipCard.style.transform =
        flipCard.style.transform === 'rotateY(180deg)' ? '' : 'rotateY(180deg)';
    };

    flipCard.appendChild(flipFront);
    flipCard.appendChild(flipBack);
    flipContainer.appendChild(flipCard);

    // Info below flip card
    const name = document.createElement('h4');
    name.textContent = book['Name'];

    const author = document.createElement('p');
    author.textContent = `Author: ${book['Author']}`;
    author.style.color = '#aaa';

    // Rating stars
    const ratingContainer = document.createElement('div');
    ratingContainer.style.cssText = 'margin: 0.5rem 0;';
    const currentRating = Math.round(book['Rating'] || 0);

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
          (ratingContainer.children[j] as HTMLElement).style.color =
            j < i ? 'gold' : 'gray';
        }
        this.updateRating(book.category, book.bookId, i);
      };
      ratingContainer.appendChild(star);
    }

    // Stock + Price
    const stock = book['Stock'] || 0;
    const priceVal = stock > 0 ? book['Price'] : 0;

    const price = document.createElement('p');
    price.textContent = stock === 0 ? 'Out of Stock' : `Price: $${priceVal}`;
    price.style.color = stock === 0 ? 'red' : 'lime';

    const stockInfo = document.createElement('p');
    stockInfo.textContent = `Stock: ${stock}`;
    stockInfo.style.color = '#ff0';

     // ✨ New Edit Button
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️ Edit';
      editBtn.style.cssText = this.buttonStyle();
      editBtn.onclick = (e) => {
        e.stopPropagation();
        this.openEditModal(book);
      };

      // ✨ New Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️ Delete';
      deleteBtn.style.cssText = this.buttonStyle();
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.deleteBook(book);
      };
  
    // Append everything
    bookBox.append(flipContainer, name, author, ratingContainer, price, stockInfo, editBtn, deleteBtn);
    booksDisplay.appendChild(bookBox);
  });
  const booksSection: HTMLElement | null = document.getElementById('booksDisplay');
    if (booksSection) {
      booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

}
