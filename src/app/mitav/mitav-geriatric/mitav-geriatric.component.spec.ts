import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitavGeriatricComponent } from './mitav-geriatric.component';

describe('MitavGeriatricComponent', () => {
  let component: MitavGeriatricComponent;
  let fixture: ComponentFixture<MitavGeriatricComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitavGeriatricComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitavGeriatricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
