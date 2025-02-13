import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitavDeliriumComponent } from './mitav-delirium.component';

describe('MitavDeliriumComponent', () => {
  let component: MitavDeliriumComponent;
  let fixture: ComponentFixture<MitavDeliriumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitavDeliriumComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitavDeliriumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
