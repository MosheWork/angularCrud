import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServersDialogComponent } from './servers-dialog.component';

describe('ServersDialogComponent', () => {
  let component: ServersDialogComponent;
  let fixture: ComponentFixture<ServersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServersDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
