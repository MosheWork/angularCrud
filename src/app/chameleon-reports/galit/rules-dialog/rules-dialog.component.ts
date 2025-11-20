import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-rules-dialog',
  template: `
    <div dir="rtl">
      <h2 mat-dialog-title>פירוט כללים - {{ data.name }}</h2>
      <mat-dialog-content>
        <div class="patient-info">
          <p><strong>מספר אשפוז:</strong> {{ data.admission_No }}</p>
          <p><strong>גיל:</strong> {{ data.age_Years }}</p>
          <p><strong>חדר:</strong> {{ data.room }}</p>
        </div>
        
        <mat-divider></mat-divider>
        
        <div class="rules-section">
          <h3>כללים שהופעלו:</h3>
          <div class="rules-list">
            <div *ngFor="let rule of rulesArray" class="rule-item">
              {{ rule }}
            </div>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="start">
        <button mat-button (click)="close()">סגור</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .patient-info {
      margin-bottom: 20px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      text-align: right;
    }
    
    .patient-info p {
      margin: 5px 0;
    }
    
    mat-divider {
      margin: 20px 0;
    }
    
    .rules-section {
      margin-top: 20px;
      text-align: right;
    }
    
    .rules-section h3 {
      color: #1976d2;
      margin-bottom: 15px;
    }
    
    .rules-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .rule-item {
      padding: 12px;
      background-color: #e3f2fd;
      border-right: 4px solid #1976d2;
      border-radius: 4px;
      font-size: 14px;
      text-align: right;
    }
    
    mat-dialog-content {
      min-width: 500px;
      max-width: 700px;
      direction: rtl;
    }

    mat-dialog-actions {
      direction: rtl;
    }
  `]
})
export class RulesDialogComponent {
  rulesArray: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<RulesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Split the rulesDescription by ' | ' to get individual rules
    if (data.rulesDescription) {
      this.rulesArray = data.rulesDescription.split(' | ').filter((r: string) => r.trim());
    } else {
      this.rulesArray = ['אין כללים זמינים'];
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}