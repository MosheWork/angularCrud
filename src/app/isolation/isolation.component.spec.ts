import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IsolationComponent } from './isolation.component';

describe('IsolationComponent', () => {
  let component: IsolationComponent;
  let fixture: ComponentFixture<IsolationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IsolationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IsolationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
