import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionsDialogNewComponent } from './permissions-dialog-new.component';

describe('PermissionsDialogNewComponent', () => {
  let component: PermissionsDialogNewComponent;
  let fixture: ComponentFixture<PermissionsDialogNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PermissionsDialogNewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PermissionsDialogNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
