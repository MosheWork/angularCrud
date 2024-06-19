import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentsListInUnitsComponent } from './components-list-in-units.component';

describe('ComponentsListInUnitsComponent', () => {
  let component: ComponentsListInUnitsComponent;
  let fixture: ComponentFixture<ComponentsListInUnitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComponentsListInUnitsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentsListInUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
