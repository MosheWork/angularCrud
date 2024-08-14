import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalliativePatientsComponent } from './palliative-patients.component';

describe('PalliativePatientsComponent', () => {
  let component: PalliativePatientsComponent;
  let fixture: ComponentFixture<PalliativePatientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PalliativePatientsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PalliativePatientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
