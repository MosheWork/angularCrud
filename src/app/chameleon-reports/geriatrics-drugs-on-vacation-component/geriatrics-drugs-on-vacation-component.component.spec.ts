import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeriatricsDrugsOnVacationComponentComponent } from './geriatrics-drugs-on-vacation-component.component';

describe('GeriatricsDrugsOnVacationComponentComponent', () => {
  let component: GeriatricsDrugsOnVacationComponentComponent;
  let fixture: ComponentFixture<GeriatricsDrugsOnVacationComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeriatricsDrugsOnVacationComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GeriatricsDrugsOnVacationComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
