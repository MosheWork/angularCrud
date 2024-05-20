import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerPingCheckAppComponent } from './server-ping-check-app.component';

describe('ServerPingCheckAppComponent', () => {
  let component: ServerPingCheckAppComponent;
  let fixture: ComponentFixture<ServerPingCheckAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerPingCheckAppComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerPingCheckAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
