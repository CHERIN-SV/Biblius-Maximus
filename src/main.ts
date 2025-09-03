import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { ContactComponent } from './app/home/contact';
import { Contact1 } from './app/admin/contact1';
import { Products } from './app/home/products';
import { CartComponent } from './app/home/cart';
import { Profile } from './app/home/profile';
import { Profile1 } from './app/admin/profile1';
import { History } from './app/home/history';
import { HelpComponent } from './app/home/help';
import { help1 } from './app/admin/help1';
import { MyBooksComponent } from './app/home/mybooks';
import { home1 } from './app/admin/home1';
import {TalismanicTomeComponent} from'./app/home/talismanic-tome';
import { BookDetail } from './app/home/book-detail';
import { BuyNowComponent } from './app/home/buy-now';
import { Admin } from './app/admin';
import { TermsComponent } from './app/home/terms';
import { term1 } from './app/admin/term1';
import { work } from './app/admin/work';
import { provideHttpClient } from '@angular/common/http';

const routes = [
  { path: 'auth-page.component', loadComponent: () => import('./app/auth-page.component').then(m => m.AuthPageComponent) },
  { path: '', loadComponent: () => import('./app/home/home').then(m => m.HomeComponent) },
  { path: 'home1', component: home1 },
  { path: 'products', component: Products },
    { path: 'cart', component: CartComponent },
    { path: 'profile', component: Profile },
      { path: 'history', component: History },
    { path: 'profile1', component: Profile1 },
    { path: 'work', component: work },
    { path: 'help1', component: help1 },
    
    { path: 'contact', component: ContactComponent },
    { path: 'contact1', component: Contact1 },
    { path: 'help', component: HelpComponent },
   {path:'talismanic-tome',component: TalismanicTomeComponent},
   { path: 'book-detail', component: BookDetail },
   { path: 'mybooks', component: MyBooksComponent },
   {
      path: 'buy-now', component:BuyNowComponent
    },
     {
       path: 'admin', component:Admin
     },
      { path: 'terms', component:TermsComponent},
      { path: 'term1', component:term1}
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), ...appConfig.providers,provideHttpClient()]

});
