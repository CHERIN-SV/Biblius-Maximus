import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Firestore, collection, query, where, getDocs, deleteDoc, doc, getDoc,setDoc, updateDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-mybooks',
  standalone: true,
  templateUrl: './mybooks.html',
  styleUrls: ['./mybooks.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MyBooksComponent implements OnInit {
  menuOpen = false;
  userEmail: string | null = null;
  profileImage = '';
  orders: any[] = [];
  loading = true;
  selectedImage = '';

  constructor(private firestore: Firestore, private auth: Auth) {}

  // 🔽 UI Navigation
  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu() { this.menuOpen = false; }
  navigate(path: string) { window.location.href = path; this.closeMenu(); }

  ngOnInit(): void {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user?.email) {
        this.loading = false;
        this.renderOrders();
        return;
      }

      // assign email first
      this.userEmail = user.email;

      // ✅ Fetch user profile image
      const userRef = doc(this.firestore, 'users', this.userEmail);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data: any = userSnap.data();
        this.selectedImage = data.image || '';
      }

      // ✅ Then load orders
      await this.loadOrders();
    });
  }

  // 📥 Load orders from Firestore
  private async loadOrders() {
    if (!this.userEmail) return;

    this.orders = [];
    const q = query(collection(this.firestore, 'order'), where('email', '==', this.userEmail));
    const snap = await getDocs(q);

    this.orders = snap.docs.map(d => {
      const data: any = d.data();
      return {
        id: d.id,
        book: data.book || 'Untitled',
        author: data.author || 'Unknown',
        category: data.category || 'General',
        price: data.price || 0,
        quantity: data.quantity || 1,
        paymentMode: data.paymentMode || 'N/A',
        transactionId: data.transactionId || 'N/A',
        address: data.address || '',
        name: data.name || '',
        timestamp: data.timestamp || null,
        image: data.image || ''
      };
    });

    this.loading = false;
    this.renderOrders();
  }

  // ❌ Cancel an order
async cancelOrder(orderId: string) {
  if (!confirm('Cancel this order?')) return;

  const orderRef = doc(this.firestore, `order/${orderId}`);
  const orderSnap = await getDoc(orderRef);

  if (orderSnap.exists()) {
    const orderData: any = orderSnap.data();
    const { category, bookId, quantity } = orderData;  // ✅ always available

    // 1️⃣ Restore stock
    if (category && bookId) {
      try {
        const bookRef = doc(this.firestore, `books/${category}/Books/${bookId}`);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          const bookData: any = bookSnap.data();
          const currentStock = bookData.Stock || 0;

          await updateDoc(bookRef, {
            Stock: currentStock + quantity
          });
          console.log(`✅ Stock restored for ${bookId}: +${quantity}`);
        }
      } catch (err) {
        console.error("⚠️ Error restoring stock:", err);
      }
    }

    try {
      // 2️⃣ Remove from order database
      await deleteDoc(orderRef);

      // 3️⃣ Remove from history database
      if (bookId) {
        const historyRef = doc(this.firestore, `history/${this.userEmail}/Books/${bookId}`);
        await deleteDoc(historyRef);
      }

      // 4️⃣ Remove from local orders array + UI
      this.orders = this.orders.filter(o => o.id !== orderId);
      this.renderOrders();

      alert('🚫 Your order is cancelled successfully');
    } catch (err) {
      console.error("⚠️ Error deleting order/history:", err);
      alert('Something went wrong while cancelling the order.');
    }
  }
}




  // 🎨 Render orders into DOM
  private renderOrders() {
    const container = document.getElementById('ordersDisplay');
    if (!container) return;

    container.innerHTML = '';

    if (this.loading) {
      container.innerHTML = `<p style="color:white;">⏳ Loading orders...</p>`;
      return;
    }

    if (this.orders.length === 0) {
      container.innerHTML = `<p style="color:white;">No books ordered yet.</p>`;
      return;
    }

    this.orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-card';
      card.style.cssText = `
        background:#111;
        border:1px solid #fff;
        padding:1rem;
        border-radius:10px;
        color:white;
        max-width:320px;
        text-align:left;
        margin:0.5rem auto;
        transition:box-shadow 0.3s ease;
      `;

      let isDisabled = false;
      if (order.timestamp) {
        const orderDate = order.timestamp.toDate();
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        isDisabled = diffDays > 7;
      }

      card.innerHTML = `
        ${order.image ? `<img src="${order.image}" alt="${order.book}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:0.5rem;">` : ''}
        <h3 style="font-size:1.2rem;color:#00e6e6;">${order.book}</h3>
        <p><strong>Author:</strong> ${order.author}</p>
        <p><strong>Category:</strong> ${order.category}</p>
        <p><strong>Quantity:</strong> ${order.quantity}</p>
        <p style="color:lime;"><strong>Total Price:</strong> $${order.price * order.quantity}</p>
        <p><strong>Payment:</strong> ${order.paymentMode}</p>
        <p><strong>Transaction ID:</strong> ${order.transactionId}</p>
        <p><strong>Delivery To:</strong> ${order.name}, ${order.address}</p>
        <p style="font-size:0.85rem;color:#ccc;">
          Ordered on: ${order.timestamp ? order.timestamp.toDate().toLocaleString() : ''}
        </p>
        <button ${isDisabled ? 'disabled' : ''} style="
          margin-top:0.5rem;
          padding:0.4rem 1rem;
          border:none;
          border-radius:0.5rem;
          background-color:${isDisabled ? '#555' : '#ff4d4d'};
          color:white;
          font-weight:bold;
          cursor:${isDisabled ? 'not-allowed' : 'pointer'};
        ">Cancel Order</button>

        <!-- ✅ Extra UI -->
        <p style="margin-top:0.8rem;color:#ffd700;">Does your order received?</p>
        <input type="text" placeholder="Write yes" style="padding:0.3rem;border-radius:5px;width:95%;margin-top:0.3rem;">
        <button class="confirm-btn" style="
          margin-top:0.5rem;
          padding:0.4rem 1rem;
          border:none;
          border-radius:0.5rem;
          background-color:#4CAF50;
          color:white;
          font-weight:bold;
          cursor:pointer;
        ">Confirm</button>
      `;

      // ✅ Cancel button logic
      if (!isDisabled) {
        card.querySelector('button')?.addEventListener('click', () => this.cancelOrder(order.id));
      }

      // ✅ Confirm button logic (remove only from screen, not DB)
      // ✅ Confirm button logic (mark as received without deleting)
const confirmBtn = card.querySelector('.confirm-btn') as HTMLButtonElement;
const inputBox = card.querySelector('input') as HTMLInputElement;
if (confirmBtn && inputBox) {
  confirmBtn.addEventListener('click', async () => {
    if (inputBox.value.trim().toLowerCase() === 'yes') {
      try {
        // 1. Update order status inside Firestore
        const orderRef = doc(this.firestore, `order/${order.id}`);
        await updateDoc(orderRef, {
          status: 'received',
          receivedAt: new Date()
        });

        // 2. Remove from UI + local array
        this.orders = this.orders.filter(o => o.id !== order.id);
        card.remove();

        alert('✅ Thank you! Your order is marked as received.Happy Reading!');
      } catch (err) {
        console.error("⚠️ Error updating status:", err);
        alert('Something went wrong while confirming.');
      }
    } else {
      alert('⚠️ Please type "yes" to confirm');
    }
  });
  
}

      container.appendChild(card);
    });
  }
}
