import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SSRIprotocolComponent } from './ssriprotocol.component';

describe('SSRIprotocolComponent', () => {
  let component: SSRIprotocolComponent;
  let fixture: ComponentFixture<SSRIprotocolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SSRIprotocolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SSRIprotocolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
