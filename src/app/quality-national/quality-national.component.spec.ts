import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualityNationalComponent } from './quality-national.component';

describe('QualityNationalComponent', () => {
  let component: QualityNationalComponent;
  let fixture: ComponentFixture<QualityNationalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QualityNationalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QualityNationalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
