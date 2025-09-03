import { Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  templateUrl: './terms.html',
  styleUrls: ['./terms.scss']
})
export class TermsComponent {
  lastUpdated: string = 'August 13, 2025';
  
}
