import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { getAuth } from 'firebase/auth';
import { updateDoc } from '@angular/fire/firestore';


@Component({
  selector: 'app-book-detail',
  standalone: true,
  templateUrl: './book-detail.html',
  styleUrls: ['./book-detail.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BookDetail implements OnInit {
  category = '';
  bookId = '';
  book: any = null;

  constructor(private route: ActivatedRoute, private firestore: Firestore) {}

  ngOnInit(): void {
    this.category = this.route.snapshot.queryParamMap.get('category')!;
    this.bookId = this.route.snapshot.queryParamMap.get('bookId')!;
    this.loadBookData();
  }

  async loadBookData() {
    const bookRef = doc(this.firestore, `books/${this.category}/Books/${this.bookId}`);
    const bookSnap = await getDoc(bookRef);
    if (bookSnap.exists()) {
      this.book = bookSnap.data();
      this.renderBookDetails();
      this.loadFeedbacks();
    }
  }

  renderBookDetails(): void {
    const detailContainer = document.getElementById('bookDetailContainer');
    if (!detailContainer || !this.book) return;

    detailContainer.innerHTML = '';

    const image = document.createElement('img');
    image.src = this.book.Image;
    image.style.width = '180px';
    image.style.borderRadius = '10px';
    image.style.marginRight = '2rem';

    const info = document.createElement('div');
    info.innerHTML = `
      <h2>${this.book.Name}</h2>
      <p><strong>Author:</strong> ${this.book.Author}</p>
      <p><strong>Price:</strong> $${this.book.Price}</p>
      <p><strong>Stock:</strong> ${this.book.Stock}</p>
      <p><strong>Rating:</strong> ${this.book.Rating} ★</p>
    `;

    const topDiv = document.createElement('div');
    topDiv.style.display = 'flex';
    topDiv.appendChild(image);
    topDiv.appendChild(info);

    // 🔗 Share button
const shareBtn = document.createElement('button');
shareBtn.textContent = '🔗 Share';
shareBtn.style.cssText = 'margin-left: 1rem; padding: 0.5rem 1rem; font-weight: bold;';

// Share popup container
const shareMenu = document.createElement('div');
shareMenu.style.cssText = `
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: none;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 9999;
`;

// Share URL
const shareUrl = `${window.location.origin}/book-detail?category=${this.category}&bookId=${this.bookId}`;

// Add share options
const options = [
  { name: "📧 Gmail", url: `mailto:?subject=Check out this book&body=${encodeURIComponent(shareUrl)}` },
  { name: "💬 WhatsApp", url: `https://wa.me/?text=${encodeURIComponent("Check out this book: " + shareUrl)}` },
  { name: "📘 Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
  { name: "🐦 Twitter", url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Check out this book!` },
  { name: "📋 Copy Link", url: "" }
];

options.forEach(opt => {
  const btn = document.createElement('button');
  btn.textContent = opt.name;
  btn.style.cssText = `
    padding: 0.3rem 0.8rem;
    border: none;
    border-radius: 5px;
    background: #f5f5f5;
    cursor: pointer;
    text-align: left;
  `;

  btn.onclick = async () => {
    if (opt.url) {
      window.open(opt.url, "_blank");
    } else {
      // Copy link
      await navigator.clipboard.writeText(shareUrl);
      alert("✅ Link copied to clipboard!");
    }
    shareMenu.style.display = "none"; // close after action
  };

  shareMenu.appendChild(btn);
});

document.body.appendChild(shareMenu);

shareBtn.onclick = (e) => {
  // Position the menu near the button
  const rect = shareBtn.getBoundingClientRect();
  shareMenu.style.top = rect.bottom + "px";
  shareMenu.style.left = rect.left + "px";
  shareMenu.style.display = shareMenu.style.display === "none" ? "flex" : "none";
};

info.appendChild(shareBtn);


    const descTitle = document.createElement('h3');
    descTitle.textContent = 'Description';

    const desc = document.createElement('p');
    desc.textContent = this.book.Description;
    desc.style.textAlign = 'justify';

    const feedbackTitle = document.createElement('h3');
    feedbackTitle.textContent = 'Leave Your Feedback';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Write your review...';
    textarea.id = 'feedbackInput';
    textarea.style.cssText = 'width: 100%; padding: 1rem; border-radius: 8px; margin-top: 1rem;';

    const button = document.createElement('button');
    button.textContent = 'Submit';
    button.style.cssText = 'margin-top: 1rem; padding: 0.6rem 1.5rem; font-weight: bold;';
    button.onclick = () => this.submitFeedback(textarea.value);

    const feedbackListTitle = document.createElement('h3');
    feedbackListTitle.textContent = 'User Feedback';

    const feedbackList = document.createElement('div');
    feedbackList.id = 'feedbackList';
    // Close Button
// Close Button
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

detailContainer.appendChild(closeBtn);


    detailContainer.append(topDiv, descTitle, desc, feedbackTitle, textarea, button, feedbackListTitle, feedbackList);
  }

async loadFeedbacks() {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email?.toLowerCase();
  if (!userEmail) return;

  const feedbackRef = collection(this.firestore, `books/${this.category}/Books/${this.bookId}/feedback`);
  const feedbackSnap = await getDocs(feedbackRef);
  const feedbackList = document.getElementById('feedbackList');
  if (!feedbackList) return;
  feedbackList.innerHTML = '';

  for (const docSnap of feedbackSnap.docs) {
    const fb = docSnap.data();
    const feedbackId = docSnap.id;
    const reactions = fb['reactions'] || {};
    const userReaction = reactions[userEmail];

    const container = document.createElement('div');
    container.style.cssText = 'margin: 1rem 0; padding: 1rem; background: #222; border-left: 4px solid #00ffff;';

    const userRow = document.createElement('div');
    const user = document.createElement('strong');
    user.textContent = fb['email']?.toLowerCase();

    const time = document.createElement('small');
    const ts = fb['timestamp']?.toDate?.().toLocaleString() || '';
    time.textContent = ` (${ts})`;

    userRow.appendChild(user);
    userRow.appendChild(time);

    const text = document.createElement('p');
    text.textContent = fb['text'];

    let likeCount = fb['likes'] || 0;
    let dislikeCount = fb['dislikes'] || 0;

    const likeBtn = document.createElement('button');
    likeBtn.innerHTML = `👍 ${likeCount}`;
    likeBtn.style.cssText = 'margin-right: 10px;';
    likeBtn.disabled = !!userReaction;

    const dislikeBtn = document.createElement('button');
    dislikeBtn.innerHTML = `👎 ${dislikeCount}`;
    dislikeBtn.style.cssText = 'margin-right: 10px;';
    dislikeBtn.disabled = !!userReaction;

    const fbDoc = doc(this.firestore, `books/${this.category}/Books/${this.bookId}/feedback/${feedbackId}`);

    likeBtn.onclick = async () => {
      if (userReaction) return;
      likeCount++;
      likeBtn.innerHTML = `👍 ${likeCount}`;
      likeBtn.disabled = true;
      dislikeBtn.disabled = true;
      await updateDoc(fbDoc, {
        likes: likeCount,
        [`reactions.${userEmail}`]: 'like'
      });
    };

    dislikeBtn.onclick = async () => {
      if (userReaction) return;
      dislikeCount++;
      dislikeBtn.innerHTML = `👎 ${dislikeCount}`;
      likeBtn.disabled = true;
      dislikeBtn.disabled = true;
      await updateDoc(fbDoc, {
        dislikes: dislikeCount,
        [`reactions.${userEmail}`]: 'dislike'
      });
    };

    const repliesSection = document.createElement('div');
    repliesSection.style.display = 'none';
    repliesSection.style.marginTop = '0.5rem';

    const repliesToggle = document.createElement('p');
    repliesToggle.textContent = 'Show replies ▼';
    repliesToggle.style.cssText = 'color: #00bfff; cursor: pointer; margin-top: 0.5rem;';
    repliesToggle.onclick = () => {
      const isHidden = repliesSection.style.display === 'none';
      repliesSection.style.display = isHidden ? 'block' : 'none';
      repliesToggle.textContent = isHidden ? 'Hide replies ▲' : 'Show replies ▼';
    };

    // Load replies
    const replyRef = collection(this.firestore, `books/${this.category}/Books/${this.bookId}/feedback/${feedbackId}/replies`);
    const replySnap = await getDocs(replyRef);
    replySnap.forEach(replyDoc => {
      const rep = replyDoc.data();
      const replyDiv = document.createElement('div');
      replyDiv.style.cssText = 'margin-left: 2rem; margin-top: 0.5rem; padding: 0.5rem; background: #111;';
      replyDiv.innerHTML = `<strong>${rep['email']}</strong>: ${rep['reply']}`;
      repliesSection.appendChild(replyDiv);
    });

    const replyBtn = document.createElement('button');
    replyBtn.textContent = '💬 Reply';
    replyBtn.onclick = async () => {
      const replyText = prompt('Reply to this comment:');
      if (replyText?.trim()) {
        const replyData = {
          email: userEmail,
          reply: replyText,
          timestamp: new Date()
        };
        await addDoc(replyRef, replyData);

        const replyDiv = document.createElement('div');
        replyDiv.style.cssText = 'margin-left: 2rem; margin-top: 0.5rem; padding: 0.5rem; background: #111;';
        replyDiv.innerHTML = `<strong>${userEmail}</strong>: ${replyText}`;
        repliesSection.appendChild(replyDiv);
        repliesSection.style.display = 'block';
        repliesToggle.textContent = 'Hide replies ▲';
      }
    };

    const actionRow = document.createElement('div');
    actionRow.appendChild(likeBtn);
    actionRow.appendChild(dislikeBtn);
    actionRow.appendChild(replyBtn);

    container.appendChild(userRow);
    container.appendChild(text);
    container.appendChild(actionRow);
    container.appendChild(repliesToggle);
    container.appendChild(repliesSection);

    feedbackList.appendChild(container);
  }
}




  async submitFeedback(text: string) {
    if (!text.trim()) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return alert('Login to submit feedback');

    const feedbackRef = collection(this.firestore, `books/${this.category}/Books/${this.bookId}/feedback`);
    await addDoc(feedbackRef, {
      email: user.email,
      text,
      timestamp: new Date()
    });

    (document.getElementById('feedbackInput') as HTMLTextAreaElement).value = '';
    this.loadFeedbacks();
  }
}
