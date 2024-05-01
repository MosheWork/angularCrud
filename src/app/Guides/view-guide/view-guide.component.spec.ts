import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewGuideComponent } from './view-guide.component';

describe('ViewGuideComponent', () => {
  let component: ViewGuideComponent;
  let fixture: ComponentFixture<ViewGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewGuideComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
