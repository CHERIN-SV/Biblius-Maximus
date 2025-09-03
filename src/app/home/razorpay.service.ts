import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class RazorpayService {
  payWithRazor(
    amount: number,
    name: string,
    email: string,
    onSuccess: (transactionId: string) => void
  ): void {
    const options = {
      key: environment.razorpayKey,
      amount: amount * 100,
      currency: 'INR',
      name: 'Biblius Maximus',
      description: 'Book Purchase',
      handler: function (response: any) {
        alert('Payment Successful! ID: ' + response.razorpay_payment_id);
        onSuccess(response.razorpay_payment_id); // ✅ Pass transaction ID
      },
      prefill: {
        name: name,
        email: email
      },
      theme: {
        color: '#F37254'
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }
}
