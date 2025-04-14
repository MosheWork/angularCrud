import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionnaireRemarksPhoneCallDialogComponent } from './questionnaire-remarks-phone-call-dialog.component';

describe('QuestionnaireRemarksPhoneCallDialogComponent', () => {
  let component: QuestionnaireRemarksPhoneCallDialogComponent;
  let fixture: ComponentFixture<QuestionnaireRemarksPhoneCallDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuestionnaireRemarksPhoneCallDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionnaireRemarksPhoneCallDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
