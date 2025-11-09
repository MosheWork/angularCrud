import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalitComponent } from './galit.component';

describe('GalitComponent', () => {
  let component: GalitComponent;
  let fixture: ComponentFixture<GalitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GalitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GalitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
