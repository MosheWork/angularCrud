import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGuideFormComponent } from './edit-guide-form.component';

describe('EditGuideFormComponent', () => {
  let component: EditGuideFormComponent;
  let fixture: ComponentFixture<EditGuideFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditGuideFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditGuideFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
