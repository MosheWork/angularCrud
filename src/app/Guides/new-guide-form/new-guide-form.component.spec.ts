import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGuideFormComponent } from './new-guide-form.component';

describe('NewGuideFormComponent', () => {
  let component: NewGuideFormComponent;
  let fixture: ComponentFixture<NewGuideFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewGuideFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewGuideFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
