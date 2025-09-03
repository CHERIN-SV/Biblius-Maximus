import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TalismanicTomeComponent } from './talismanic-tome';

describe('TalismanicTome', () => {
  let component: TalismanicTomeComponent;
  let fixture: ComponentFixture<TalismanicTomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TalismanicTomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TalismanicTomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
