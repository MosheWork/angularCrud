import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutritionistReportComponent } from './nutritionist-report.component';

describe('NutritionistReportComponent', () => {
  let component: NutritionistReportComponent;
  let fixture: ComponentFixture<NutritionistReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NutritionistReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NutritionistReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
