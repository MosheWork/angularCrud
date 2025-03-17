import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCrmComponent } from './admin-crm.component';

describe('AdminCrmComponent', () => {
  let component: AdminCrmComponent;
  let fixture: ComponentFixture<AdminCrmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminCrmComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminCrmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
