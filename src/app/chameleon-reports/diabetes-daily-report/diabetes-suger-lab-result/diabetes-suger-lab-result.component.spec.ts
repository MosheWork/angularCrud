import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiabetesSugerLabResultComponent } from './diabetes-suger-lab-result.component';

describe('DiabetesSugerLabResultComponent', () => {
  let component: DiabetesSugerLabResultComponent;
  let fixture: ComponentFixture<DiabetesSugerLabResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiabetesSugerLabResultComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiabetesSugerLabResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
