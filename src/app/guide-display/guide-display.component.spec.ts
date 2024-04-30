import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuideDisplayComponent } from './guide-display.component';

describe('GuideDisplayComponent', () => {
  let component: GuideDisplayComponent;
  let fixture: ComponentFixture<GuideDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GuideDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GuideDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
