import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeniorDoctorNotSighnedComponentComponent } from './senior-doctor-not-sighned-component.component';

describe('SeniorDoctorNotSighnedComponentComponent', () => {
  let component: SeniorDoctorNotSighnedComponentComponent;
  let fixture: ComponentFixture<SeniorDoctorNotSighnedComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeniorDoctorNotSighnedComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeniorDoctorNotSighnedComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
