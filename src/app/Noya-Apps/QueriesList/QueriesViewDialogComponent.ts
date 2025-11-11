import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-queries-view-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.query.queryName }}</h2>

    <div mat-dialog-content>
      <pre>{{ data.query.queryText }}</pre>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="copyText()">העתק</button>
      <button mat-stroked-button color="warn" (click)="close()">סגור</button>
    </div>
  `,
  styles: [`
    pre { white-space: pre-wrap; word-break: break-word; }
  `]
})
export class QueriesViewDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { query: any },
    private dialogRef: MatDialogRef<QueriesViewDialogComponent>
  ) {}

  copyText() {
    navigator.clipboard.writeText(this.data.query.queryText).then(() => {
      alert('הטקסט הועתק בהצלחה!');
    });
  }

  close() {
    this.dialogRef.close();
  }
}
