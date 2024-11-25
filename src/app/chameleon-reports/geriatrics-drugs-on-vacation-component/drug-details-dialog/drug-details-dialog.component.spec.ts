import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugDetailsDialogComponent } from './drug-details-dialog.component';

describe('DrugDetailsDialogComponent', () => {
  let component: DrugDetailsDialogComponent;
  let fixture: ComponentFixture<DrugDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrugDetailsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrugDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
