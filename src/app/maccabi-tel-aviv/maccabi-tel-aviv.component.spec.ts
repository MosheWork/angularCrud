import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaccabiTelAvivComponent } from './maccabi-tel-aviv.component';

describe('MaccabiTelAvivComponent', () => {
  let component: MaccabiTelAvivComponent;
  let fixture: ComponentFixture<MaccabiTelAvivComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaccabiTelAvivComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MaccabiTelAvivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
