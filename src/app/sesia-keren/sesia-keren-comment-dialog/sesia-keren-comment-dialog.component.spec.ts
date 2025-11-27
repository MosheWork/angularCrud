import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SesiaKerenCommentDialogComponent } from './sesia-keren-comment-dialog.component';

describe('SesiaKerenCommentDialogComponent', () => {
  let component: SesiaKerenCommentDialogComponent;
  let fixture: ComponentFixture<SesiaKerenCommentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SesiaKerenCommentDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SesiaKerenCommentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
