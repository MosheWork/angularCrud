import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainSurgeryComponent } from './main-surgery.component';

describe('MainSurgeryComponent', () => {
  let component: MainSurgeryComponent;
  let fixture: ComponentFixture<MainSurgeryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainSurgeryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainSurgeryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
