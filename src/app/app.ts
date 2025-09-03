import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RazorpayService } from './home/razorpay.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // ✅ only import RouterOutlet
  template: `<router-outlet></router-outlet>`,
  styleUrl: './app.scss'
})
export class AppComponent {
  protected title = 'Biblius-Maximus';
  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  } 
  constructor(private razorpay: RazorpayService) {}

  pay() {
    this.razorpay.payWithRazor(500, 'Your Name', 'youremail@example.com', () => {
      console.log('Payment Callback Fired!');
    });
  }

}
