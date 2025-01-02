import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Drug2hReviewComponent } from './drug2h-review.component';

describe('Drug2hReviewComponent', () => {
  let component: Drug2hReviewComponent;
  let fixture: ComponentFixture<Drug2hReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Drug2hReviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Drug2hReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
