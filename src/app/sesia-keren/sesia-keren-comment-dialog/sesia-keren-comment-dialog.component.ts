import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface SesiaKerenCommentDialogData {
  caseNumber: string;
  patientName: string | null;
  surgeryDate: string | null;
  comment: string | null;
}

@Component({
  selector: 'app-sesia-keren-comment-dialog',
  templateUrl: './sesia-keren-comment-dialog.component.html',
  styleUrls: ['./sesia-keren-comment-dialog.component.scss']
})
export class SesiaKerenCommentDialogComponent {

  commentText: string;

  constructor(
    public dialogRef: MatDialogRef<SesiaKerenCommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SesiaKerenCommentDialogData
  ) {
    this.commentText = data.comment || '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close({ comment: this.commentText });
  }
}
