import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneCallDialogComponent } from './phone-call-dialog.component';

describe('PhoneCallDialogComponent', () => {
  let component: PhoneCallDialogComponent;
  let fixture: ComponentFixture<PhoneCallDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhoneCallDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoneCallDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
