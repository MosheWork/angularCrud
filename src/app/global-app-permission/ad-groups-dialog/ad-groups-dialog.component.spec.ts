import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdGroupsDialogComponent } from './ad-groups-dialog.component';

describe('AdGroupsDialogComponent', () => {
  let component: AdGroupsDialogComponent;
  let fixture: ComponentFixture<AdGroupsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdGroupsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdGroupsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
