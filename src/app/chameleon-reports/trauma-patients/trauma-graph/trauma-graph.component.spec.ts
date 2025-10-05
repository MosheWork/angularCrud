import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraumaGraphComponent } from './trauma-graph.component';

describe('TraumaGraphComponent', () => {
  let component: TraumaGraphComponent;
  let fixture: ComponentFixture<TraumaGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraumaGraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TraumaGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
