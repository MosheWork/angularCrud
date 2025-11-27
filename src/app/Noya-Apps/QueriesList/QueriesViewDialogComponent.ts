import { Component, Inject, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-queries-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.query.queryName }}</h2>
    <div class="separator top-separator"></div>

    <div mat-dialog-content class="dialog-content">
      <pre class="query-text" (mouseup)="highlightSelection($event)">
{{ data.query.queryText }}
      </pre>

      <table class="details-table" dir="rtl">
        <tr>
          <td><b>תיאור:</b></td>
          <td>{{ data.query.description || '---' }}</td>
        </tr>

        <tr>
          <td><b>נושא:</b></td>
          <td>{{ data.query.subject || '---' }}</td>
        </tr>

        <tr>
          <td><b>תת נושא:</b></td>
          <td>{{ data.query.subSubject || '---' }}</td>
        </tr>

        <tr>
          <td><b>נוצר על ידי:</b></td>
          <td>{{ data.query.createdByName || data.query.createdBy || '---' }}</td>
        </tr>

        <tr>
          <td><b>נוצר עבור:</b></td>
          <td>{{ data.query.createdForName || data.query.createdFor || '---' }}</td>
        </tr>

        <tr>
          <td><b>נוצר בתאריך:</b></td>
          <td>{{ data.query.createdAt ? (data.query.createdAt | date:'dd/MM/yy') : '---' }}</td>
        </tr>

        <tr>
          <td><b>עודכן בתאריך:</b></td>
          <td>{{ data.query.updatedAt ? (data.query.updatedAt | date:'dd/MM/yy') : '---' }}</td>
        </tr>

        <tr>
          <td><b>סטטוס:</b></td>
          <td>{{ data.query.isActive ? 'פעיל' : 'לא פעיל' }}</td>
        </tr>
        
      </table>
    </div>

    <div class="separator bottom-separator"></div>

    <div mat-dialog-actions align="end" class="actions">
      <button mat-flat-button color="primary" (click)="copyText()">📋 העתק</button>
      <button mat-stroked-button color="warn" (click)="close()">סגור</button>
    </div>
  `,
  styles: [`
    .dialog-content {
      max-height: 60vh;
      overflow-y: auto;
      padding: 1rem;
      background: #92c4fdff;
      border-radius: 8px;
    }

    h2 {
      margin-bottom: 0.5rem;
      text-align: center;
      font-weight: 600;
    }

    .query-text {
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
      font-family: Consolas, monospace;
      font-size: 14px;
      color: #333;
      margin-bottom: 1rem;
      background: #fff;
      padding: 0.5rem;
      border-radius: 4px;
    }

    .separator {
      height: 1px;
      background-color: #000;
      margin: 8px 0;
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      font-family: Calibri, sans-serif;
      background: #fff;
      border-radius: 4px;
    }

    .details-table td {
      padding: 4px 8px;
      vertical-align: top;
    }

    .details-table td:first-child {
      width: 140px;
      font-weight: 600;
    }

    .actions {
      margin: 1rem;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    ::selection {
      background: #b2dcff;
      color: #000;
    }
  `]
})
export class QueriesViewDialogComponent implements AfterViewInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { query: any },
    private dialogRef: MatDialogRef<QueriesViewDialogComponent>
  ) {}

  ngAfterViewInit() {
    const container = document.querySelector('[mat-dialog-content]');
    if (container) (container as HTMLElement).scrollTop = 0;
  }

  copyText() {
    navigator.clipboard.writeText(this.data.query.queryText).then(() => {
      alert('הטקסט הועתק בהצלחה!');
    });
  }

  close() {
    this.dialogRef.close();
  }

  highlightSelection(_: MouseEvent) {}
}
