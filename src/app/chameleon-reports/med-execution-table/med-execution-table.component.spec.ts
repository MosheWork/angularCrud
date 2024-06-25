import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedExecutionTableComponent } from './med-execution-table.component';

describe('MedExecutionTableComponent', () => {
  let component: MedExecutionTableComponent;
  let fixture: ComponentFixture<MedExecutionTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MedExecutionTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MedExecutionTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
