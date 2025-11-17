import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SesiaKerenComponent } from './sesia-keren.component';

describe('SesiaKerenComponent', () => {
  let component: SesiaKerenComponent;
  let fixture: ComponentFixture<SesiaKerenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SesiaKerenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SesiaKerenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
