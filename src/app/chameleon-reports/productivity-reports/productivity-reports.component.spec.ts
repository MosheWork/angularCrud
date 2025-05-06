import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityReportsComponent } from './productivity-reports.component';

describe('ProductivityReportsComponent', () => {
  let component: ProductivityReportsComponent;
  let fixture: ComponentFixture<ProductivityReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductivityReportsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
