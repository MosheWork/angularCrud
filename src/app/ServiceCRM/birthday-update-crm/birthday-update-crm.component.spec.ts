import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BirthdayUpdateCRMComponent } from './birthday-update-crm.component';

describe('BirthdayUpdateCRMComponent', () => {
  let component: BirthdayUpdateCRMComponent;
  let fixture: ComponentFixture<BirthdayUpdateCRMComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BirthdayUpdateCRMComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BirthdayUpdateCRMComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
