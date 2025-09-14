import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorAuthorizationsComponent } from './doctor-authorizations.component';

describe('DoctorAuthorizationsComponent', () => {
  let component: DoctorAuthorizationsComponent;
  let fixture: ComponentFixture<DoctorAuthorizationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DoctorAuthorizationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorAuthorizationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
