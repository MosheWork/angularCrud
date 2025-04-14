import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionnaireRemarksComponent } from './questionnaire-remarks.component';

describe('QuestionnaireRemarksComponent', () => {
  let component: QuestionnaireRemarksComponent;
  let fixture: ComponentFixture<QuestionnaireRemarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuestionnaireRemarksComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionnaireRemarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
