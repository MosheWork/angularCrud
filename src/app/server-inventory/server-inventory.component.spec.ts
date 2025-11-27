import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerInventoryComponent } from './server-inventory.component';

describe('ServerInventoryComponent', () => {
  let component: ServerInventoryComponent;
  let fixture: ComponentFixture<ServerInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerInventoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
