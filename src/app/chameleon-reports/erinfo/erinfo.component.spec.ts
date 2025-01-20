import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ERInfoComponent } from './erinfo.component';

describe('ERInfoComponent', () => {
  let component: ERInfoComponent;
  let fixture: ComponentFixture<ERInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ERInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ERInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
