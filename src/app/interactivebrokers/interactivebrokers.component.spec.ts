import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractivebrokersComponent } from './interactivebrokers.component';

describe('InteractivebrokersComponent', () => {
  let component: InteractivebrokersComponent;
  let fixture: ComponentFixture<InteractivebrokersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InteractivebrokersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractivebrokersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
