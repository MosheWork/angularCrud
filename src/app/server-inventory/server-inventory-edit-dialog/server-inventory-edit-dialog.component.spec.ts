import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerInventoryEditDialogComponent } from './server-inventory-edit-dialog.component';

describe('ServerInventoryEditDialogComponent', () => {
  let component: ServerInventoryEditDialogComponent;
  let fixture: ComponentFixture<ServerInventoryEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerInventoryEditDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerInventoryEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
