import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { RazorpayService } from './razorpay.service';
import { getAuth } from 'firebase/auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

@Component({
  selector: 'app-buy-now',
  standalone: true,
  templateUrl: './buy-now.html',
  styleUrls: ['./buy-now.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BuyNowComponent implements OnInit {
  book: any = null;
  category = '';
  bookId = '';
  price = 0;
  quantity = 1;
  selectedPayment = '';
  today = new Date().toLocaleDateString();
  userName = '';
  userAddress = '';
  userEmail = '';
  description='';
  usdToInrRate = 83;
  termsAccepted = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private razorpayService: RazorpayService
  ) {}

  async ngOnInit(): Promise<void> {
    this.category = this.route.snapshot.queryParamMap.get('category')!;
    this.bookId = this.route.snapshot.queryParamMap.get('bookId')!;
    await this.loadUserDetails();
    await this.loadBook();
  }

  async loadUserDetails() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user?.email) {
      console.warn('❌ No logged-in user');
      return;
    }

    this.userEmail = user.email;

    const userDocRef = doc(this.firestore, 'users', user.email);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      this.userName = data['name'] || 'Name Not Found';
      this.userAddress = data['address'] || 'Address Not Found';
      console.log('✅ User:', this.userName, this.userAddress, this.userEmail);
    } else {
      console.warn('❌ User document not found in Firestore');
    }
  }

  async loadBook() {
    const bookRef = doc(this.firestore, `books/${this.category}/Books/${this.bookId}`);
    const bookSnap = await getDoc(bookRef);
    if (bookSnap.exists()) {
      this.book = bookSnap.data();
      const stock = this.book['Stock'];
      this.price = stock > 5 ? this.book['Price'] : (stock > 0 ? this.book['Price']  : 0);
      this.renderBuyNowUI();
    }
  }

 renderBuyNowUI() {
  const container = document.getElementById('buyNowContainer');
  if (!container || !this.book) return;

  container.innerHTML = '';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '⨉';
  closeBtn.style.cssText = `
    float: right;
    margin: -1rem -1rem 1rem 0;
    padding: 0.4rem 1rem;
    font-weight: bold;
    font-size: 1.2rem;
    color: red;
    background: white;
    border: none;
    cursor: pointer;
  `;
  closeBtn.onclick = () => window.location.href = '/products';

  const image = document.createElement('img');
  image.src = this.book['Image'];
  image.style.width = '180px';
  image.style.borderRadius = '10px';
  image.style.marginRight = '2rem';

  const info = document.createElement('div');
  info.innerHTML = `
    <h2>${this.book['Name']}</h2>
    <p><strong>Author:</strong> ${this.book['Author']}</p>
    <p><strong>Description:</strong> ${this.book['Description']}</p>
    <p><strong>Stock:</strong> <span style="color:${this.book['Stock'] > 0 ? 'lime' : 'red'}">${this.book['Stock'] > 0 ? 'In Stock' : 'Out of Stock'}</span></p>
    <p><strong>Price (per unit):</strong> $${this.price}</p>
  `;

  const qtyLabel = document.createElement('label');
  qtyLabel.textContent = 'Quantity: ';
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.min = '1';
  qtyInput.value = this.quantity.toString();
  qtyInput.style.marginLeft = '1rem';

  const totalPrice = document.createElement('p');
  totalPrice.textContent = `Total: $${this.price * this.quantity} (₹${Math.round(this.price * this.quantity * this.usdToInrRate)})`;
  totalPrice.style.marginTop = '1rem';

  qtyInput.oninput = (e: any) => {
    this.quantity = parseInt(e.target.value) || 1;
    totalPrice.textContent = `Total: $${this.price * this.quantity} (₹${Math.round(this.price * this.quantity * this.usdToInrRate)})`;
  };

  qtyLabel.appendChild(qtyInput);

  // Terms checkbox
  const termsWrapper = document.createElement('div');
  termsWrapper.style.marginTop = '1rem';
  const termsCheckbox = document.createElement('input');
  termsCheckbox.type = 'checkbox';
  termsCheckbox.id = 'termsCheck';
  termsCheckbox.style.marginRight = '0.5rem';
  const termsLabel = document.createElement('label');
  termsLabel.setAttribute('for', 'termsCheck');
  termsLabel.innerHTML = `I agree to the <a href="/terms" target="_blank">Terms & Conditions</a>`;
  termsWrapper.appendChild(termsCheckbox);
  termsWrapper.appendChild(termsLabel);

  // Payment section (hidden initially)
  const paymentTitle = document.createElement('h3');
  paymentTitle.textContent = 'Choose Payment Method';
  paymentTitle.style.display = 'none';

  const razorBtn = document.createElement('button');
  razorBtn.textContent = 'Pay with Razorpay';
  razorBtn.style.display = 'none';
  razorBtn.onclick = () => this.payWithRazor();

  const gpayBtn = document.createElement('button');
  gpayBtn.textContent = 'Pay with Google Pay';
  gpayBtn.style.marginLeft = '1rem';
  gpayBtn.style.display = 'none';
  gpayBtn.onclick = () => this.showGPayQR(container);

  const codBtn = document.createElement('button');
  codBtn.textContent = 'Cash on Delivery';
  codBtn.style.marginLeft = '1rem';
  codBtn.style.display = 'none';
  codBtn.onclick = () => this.placeOrder('COD');

  // Show payment options only when checkbox is checked
  termsCheckbox.addEventListener('change', () => {
    const show = termsCheckbox.checked;
    paymentTitle.style.display = show ? '' : 'none';
    razorBtn.style.display = show ? '' : 'none';
    gpayBtn.style.display = show ? '' : 'none';
    codBtn.style.display = show ? '' : 'none';
  });

  container.append(
    closeBtn,
    image,
    info,
    qtyLabel,
    totalPrice,
    termsWrapper,
    paymentTitle,
    razorBtn,
    gpayBtn,
    codBtn
  );
}


  async showGPayQR(container: HTMLElement) {
    const existing = document.getElementById('gpaySection');
    if (existing) existing.remove();

    const section = document.createElement('div');
    section.id = 'gpaySection';
    section.style.marginTop = '2rem';
    section.style.padding = '1rem';
    section.style.background = '#222';
    section.style.borderRadius = '1rem';
    section.style.textAlign = 'center';

    const inrTotal = Math.round(this.price * this.quantity * this.usdToInrRate);
    const upiLink = `upi://pay?pa=cherinpappu207@oksbi&pn=BibliusMaximus&am=${inrTotal}&cu=INR`;

    const qrTitle = document.createElement('h4');
    qrTitle.textContent = `Scan & Pay ₹${inrTotal}`;
    qrTitle.style.color = 'lime';

    const qrImg = document.createElement('img');
    qrImg.alt = 'GPay QR';
    qrImg.style.width = '200px';
    qrImg.style.margin = '1rem';
    qrImg.style.borderRadius = '10px';

    const qrDataUrl = await QRCode.toDataURL(upiLink);
    qrImg.src = qrDataUrl;

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '✅ Confirm Payment';
    confirmBtn.style.display = 'block';
    confirmBtn.style.margin = '1rem auto';
    confirmBtn.style.padding = '0.5rem 1.2rem';
    confirmBtn.onclick = () => this.placeOrder('GPay');

    section.appendChild(qrTitle);
    section.appendChild(qrImg);
    section.appendChild(confirmBtn);

    container.appendChild(section);
  }

payWithRazor() {
  const inrTotal = Math.round(this.price * this.quantity * this.usdToInrRate);

  this.razorpayService.payWithRazor(
    inrTotal,
    this.userName || 'Customer',
    this.userEmail || 'email@example.com',
    (transactionId: string) => this.placeOrder('Razorpay', transactionId) // ✅ transactionId passed correctly
  );
}

// ✅ Updated to accept transactionId
async placeOrder(mode: string, transactionId?: string) {
  this.selectedPayment = mode;
  const orderId = Date.now().toString();
  const orderRef = doc(this.firestore, `order/${orderId}`);

  await setDoc(orderRef, {
    bookId: this.bookId, 
    book: this.book['Name'],
    author: this.book['Author'],
    category: this.category,
    price: this.price * this.quantity,
    quantity: this.quantity,
    paymentMode: mode,
    transactionId: transactionId || `COD-${orderId}`, // ✅ will store Razorpay transaction id if present
    name: this.userName,
    address: this.userAddress,
    email: this.userEmail,
    timestamp: new Date(),
    image: this.book['Image'], 
  });

  const historyRef = doc(this.firestore, `history/${this.userEmail}/Books/${this.bookId}`);
  await setDoc(historyRef, {
    bookId: this.bookId, 
    book: this.book['Name'],
    author: this.book['Author'],
    description:this.book['Description'],
    category: this.category,
    price: this.price * this.quantity,
    quantity: this.quantity,
    paymentMode: mode,
    transactionId: transactionId || `COD-${orderId}`,
    name: this.userName,
    address: this.userAddress,
    email: this.userEmail,
    timestamp: new Date(),
    image: this.book['Image'],
    status: "purchased"  // extra flag for history
  });

  await updateDoc(doc(this.firestore, `books/${this.category}/Books/${this.bookId}`), {
    Stock: this.book['Stock'] - this.quantity
  });

  console.log('📦 Order placed for:', this.userName, this.userAddress, this.userEmail);
  this.displayReceipt();
}


  displayReceipt() {
    const rBook = document.getElementById('rBook');
    const rAuthor = document.getElementById('rAuthor');
    const rPrice = document.getElementById('rPrice');
    const rQty = document.getElementById('rQty');
    const rMode = document.getElementById('rMode');
    const rDate = document.getElementById('rDate');
    const rName = document.getElementById('rName');
    const rAddress = document.getElementById('rAddress');
    const rEmail = document.getElementById('rEmail');
    const receipt = document.getElementById('receipt');

    if (rBook && rAuthor && rPrice && rQty && rMode && rDate && rName && rAddress && rEmail && receipt) {
      rBook.textContent = this.book['Name'];
      rAuthor.textContent = this.book['Author'];
      rPrice.textContent = (this.price * this.quantity).toString();
      rQty.textContent = this.quantity.toString();
      rMode.textContent = this.selectedPayment;
      rDate.textContent = this.today;
      rName.textContent = this.userName;
      rAddress.textContent = this.userAddress;
      rEmail.textContent = this.userEmail;

      receipt.style.display = 'block';

      const pdf = new jsPDF('p', 'mm', 'a4');
const pageWidth = 210;
const margin = 20;
const contentWidth = pageWidth - margin * 2;
let y = 15;

// === 1. Header Section Box ===
pdf.setFillColor(240, 230, 255); 
  pdf.rect(0, 0, 210, 35, 'F');
pdf.setDrawColor(0);
pdf.setLineWidth(0.4);
 // header container

// === Header Title ===
pdf.setTextColor('#6c5ce7');
pdf.setFontSize(18);
pdf.text('Biblius Maximus', pageWidth / 2, y, { align: 'center' });
y += 8;

pdf.setFontSize(12);
pdf.setTextColor('#000000');
pdf.text('YOUR ORDER RECEIPT', pageWidth / 2, y, { align: 'center' });
y += 25;

// === 2. User Info ===
pdf.setFontSize(11);
pdf.setTextColor('#000');
pdf.text(`Date: ${this.today}`, margin + 2, y);
y += 7;
pdf.text(`Name: ${this.userName}`, margin + 2, y);
y += 7;
pdf.text(`Email: ${this.userEmail}`, margin + 2, y);
y += 12; // add extra vertical space here before table

// === 3. Table Headers ===
const col1 = margin + 2;
const col2 = col1 + 12;    // SL
const col3 = col2 + 80;    // Book Title
const col4 = col3 + 30;    // Price
const col5 = col4 + 20;    // Qty

pdf.setFillColor(230, 230, 230);
pdf.rect(col1, y - 5, contentWidth - 4, 8, 'F');

pdf.setFontSize(11);
pdf.setTextColor('#000');
pdf.text('SL', col1 + 2, y);
pdf.text('Book Title', col2 + 2, y);
pdf.text('Price', col3 + 2, y);
pdf.text('Qty', col4 + 2, y);
y += 10;

// === 4. Table Row ===
pdf.text('1', col1 + 2, y);
pdf.text(this.book['Name'], col2 + 2, y);
pdf.text(`$${this.price.toFixed(2)}`, col3 + 2, y);
pdf.text(`${this.quantity}`, col4 + 2, y);
y += 25;

// === 5. Subtotal / Tax / Total (Right-Aligned) ===
const totalPrice = (this.price * this.quantity).toFixed(2);
const labelX = pageWidth - margin - 60;
const valueX = pageWidth - margin;

pdf.setFontSize(11);
pdf.text('Subtotal:', labelX, y);
pdf.text(`$${totalPrice}`, valueX, y, { align: 'right' });
y += 6;

pdf.text('Tax:', labelX, y);
pdf.text('$0.00', valueX, y, { align: 'right' });
y += 6;

pdf.text('TOTAL:', labelX, y);
pdf.text(`$${totalPrice}`, valueX, y, { align: 'right' });
y += 10;

pdf.setFont("helvetica", "bolditalic");
  pdf.text("Unlock worlds with Biblius Maximus...", margin, 160);

  // 🖋 Footer Stripe
  pdf.setFillColor(240, 230, 255);
  pdf.rect(0, 285, 210, 12, 'F');
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(9);
  pdf.text("Thank you for choosing Biblius Maximus!", 105, 292, { align: "center" });
// === 7. Save PDF ===
pdf.save(`receipt.pdf`);

    }
  }
}
