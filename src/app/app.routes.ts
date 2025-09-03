// app.route.ts
import { Routes } from '@angular/router';

// Eager-loaded Component Imports
import { AuthPageComponent } from './auth-page.component';
import { Admin } from './admin';
import { HomeComponent } from './home/home';
import { home1} from './admin/home1';
import { ContactComponent } from './home/contact';
import { Products } from './home/products';
import { CartComponent } from './home/cart';
import { Profile } from './home/profile';
import { Profile1 } from './admin/profile1';
import { HelpComponent } from './home/help';
import { help1} from './admin/help1';
import {TalismanicTomeComponent} from'./home/talismanic-tome';
import { TalismanicTomeGuard } from './home/guard';
import { BookDetail } from './home/book-detail';
import { BuyNowComponent } from './home/buy-now';
import { TermsComponent } from './home/terms';
import { MyBooksComponent } from './home/mybooks';
import { History } from './home/history';
import { term1 } from './admin/term1';
import { work } from './admin/work';


export const routes: Routes = [
  { path: 'auth-page.component', component: AuthPageComponent },
  { path: '', component: HomeComponent },
   { path: 'home1', component: home1},
  { path: 'products', component: Products },
  { path: 'work', component: work },
  { path: 'cart', component: CartComponent },
  { path: 'mybooks', component: MyBooksComponent },
   { path: 'history', component: History },
  { path: 'profile', component: Profile },
  { path: 'profile1', component: Profile1 },
  { path: 'contact', component: ContactComponent },
  { path: 'help', component: HelpComponent },
  { path: 'help1', component: help1 },
  {
    path: 'talismanic-tome',
    component: TalismanicTomeComponent,
    canActivate: [TalismanicTomeGuard]
  },
  { path: 'book-detail', component: BookDetail },
  {
   path: 'buy-now', component:BuyNowComponent
 },
 {
   path: 'admin', component:Admin
 },
 { path: 'terms', component:TermsComponent},
  { path: 'term1', component:term1}
];
