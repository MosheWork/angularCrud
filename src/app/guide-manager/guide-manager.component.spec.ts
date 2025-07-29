import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuideManagerComponent } from './guide-manager.component';

describe('GuideManagerComponent', () => {
  let component: GuideManagerComponent;
  let fixture: ComponentFixture<GuideManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GuideManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GuideManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
