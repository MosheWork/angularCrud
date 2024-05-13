import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterGuideComponent } from './footer-guide.component';

describe('FooterGuideComponent', () => {
  let component: FooterGuideComponent;
  let fixture: ComponentFixture<FooterGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FooterGuideComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
