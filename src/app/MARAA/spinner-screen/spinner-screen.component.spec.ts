import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinnerScreenComponent } from './spinner-screen.component';

describe('SpinnerScreenComponent', () => {
  let component: SpinnerScreenComponent;
  let fixture: ComponentFixture<SpinnerScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpinnerScreenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpinnerScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
