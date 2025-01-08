import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiabetesConsultationComponent } from './diabetes-consultation.component';

describe('DiabetesConsultationComponent', () => {
  let component: DiabetesConsultationComponent;
  let fixture: ComponentFixture<DiabetesConsultationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiabetesConsultationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiabetesConsultationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
