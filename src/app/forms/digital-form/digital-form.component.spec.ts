import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalFormComponent } from './digital-form.component';

describe('DigitalFormComponent', () => {
  let component: DigitalFormComponent;
  let fixture: ComponentFixture<DigitalFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DigitalFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
