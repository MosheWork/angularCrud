import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MItavMainPageComponent } from './mitav-main-page.component';

describe('MItavMainPageComponent', () => {
  let component: MItavMainPageComponent;
  let fixture: ComponentFixture<MItavMainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MItavMainPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MItavMainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
