import { Component, Inject, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-queries-view-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.query.queryName }}</h2>

    <div mat-dialog-content #contentContainer>
      <pre class="query-text" (mouseup)="highlightSelection($event)">
        {{ data.query.queryText }}
      </pre>
    </div>

    <div mat-dialog-actions align="end" class="actions">
      <button mat-flat-button color="primary" (click)="copyText()">📋 העתק</button>
      <button mat-stroked-button color="warn" (click)="close()">סגור</button>
    </div>
  `,
  styles: [`
    [mat-dialog-content] {
      max-height: 60vh;
      overflow-y: auto;
      padding: 1rem;
      background: #fafafa;
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
      font-family: "Consolas", monospace;
      font-size: 14px;
      color: #333;
      cursor: text;
    }

    .actions {
      margin-top: 1rem;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    ::selection {
      background: #ffeb3b; /* bright yellow */
      color: #000;
    }
  `]
})
export class QueriesViewDialogComponent implements AfterViewInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { query: any },
    private dialogRef: MatDialogRef<QueriesViewDialogComponent>,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit() {
    // Ensure the text area is scrolled to top when opened
    const container = this.el.nativeElement.querySelector('[mat-dialog-content]');
    if (container) container.scrollTop = 0;
  }

  copyText() {
    navigator.clipboard.writeText(this.data.query.queryText).then(() => {
      // You can replace alert() with a nicer snack bar later if desired
      alert('הטקסט הועתק בהצלחה!');
    });
  }

  close() {
    this.dialogRef.close();
  }

  highlightSelection(event: MouseEvent) {
    // No need for manual highlight injection — we use CSS ::selection
    // This handler just ensures user interaction is captured for touch devices if needed
  }
}
