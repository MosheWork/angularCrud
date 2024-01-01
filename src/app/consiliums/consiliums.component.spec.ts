import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsiliumsComponent } from './consiliums.component';

describe('ConsiliumsComponent', () => {
  let component: ConsiliumsComponent;
  let fixture: ComponentFixture<ConsiliumsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsiliumsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsiliumsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
