import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AwsClaudeInvocationComponent } from './aws-claude-invocation.component';

describe('AwsClaudeInvocationComponent', () => {
  let component: AwsClaudeInvocationComponent;
  let fixture: ComponentFixture<AwsClaudeInvocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AwsClaudeInvocationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AwsClaudeInvocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
