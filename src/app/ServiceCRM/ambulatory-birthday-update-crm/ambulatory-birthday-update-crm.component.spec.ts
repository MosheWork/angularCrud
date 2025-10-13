import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmbulatoryBirthdayUpdateCrmComponent } from './ambulatory-birthday-update-crm.component';

describe('AmbulatoryBirthdayUpdateCrmComponent', () => {
  let component: AmbulatoryBirthdayUpdateCrmComponent;
  let fixture: ComponentFixture<AmbulatoryBirthdayUpdateCrmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmbulatoryBirthdayUpdateCrmComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmbulatoryBirthdayUpdateCrmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
