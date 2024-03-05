import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StazerimComponent } from './stazerim.component';

describe('StazerimComponent', () => {
  let component: StazerimComponent;
  let fixture: ComponentFixture<StazerimComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StazerimComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StazerimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
