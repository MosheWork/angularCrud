import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainSurgeryDialogComponent } from './main-surgery-dialog.component';

describe('MainSurgeryDialogComponent', () => {
  let component: MainSurgeryDialogComponent;
  let fixture: ComponentFixture<MainSurgeryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainSurgeryDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainSurgeryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
