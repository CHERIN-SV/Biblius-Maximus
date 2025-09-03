import { ComponentFixture, TestBed } from '@angular/core/testing';

import {BuyNowComponent } from './buy-now';

describe('BuyNow', () => {
  let component: BuyNowComponent;
  let fixture: ComponentFixture<BuyNowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyNowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuyNowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
