import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinksLogComponent } from './links-log.component';

describe('LinksLogComponent', () => {
  let component: LinksLogComponent;
  let fixture: ComponentFixture<LinksLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LinksLogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LinksLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
