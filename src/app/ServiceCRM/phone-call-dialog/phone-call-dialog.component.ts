import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';


@Component({
  selector: 'app-phone-call-dialog',
  templateUrl: './phone-call-dialog.component.html',
  styleUrls: ['./phone-call-dialog.component.scss']
})
export class PhoneCallDialogComponent {
  callForm: FormGroup;
  categories: string[] = [
    ' ',
    'בירור חיובים',
    'דחיית/ ביטול ניתוח',
    'הבעת תודה',
    'העברת מידע והסברים',
    'זמני המתנה לבדיקות רופא/ה',
    'זמני המתנה למועד התור',
    'זמני המתנה לתוצאות בדיקה',
    'חניה',
    'טיפול מקצועי לקוי (לכאורה)',
    'יחס עובד - שלילי',
    'כשל במענה הטלפוני',
    'ליקוי ברשומה רפואית',
    'נושא חדש ממוקד',
    'שילוט',
    'שפה',
    'תנאים פיזיים',
    'אובדן ציוד',
    'אחר'
  ];
  
  constructor(
    public dialogRef: MatDialogRef<PhoneCallDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.callForm = this.fb.group({
      caseManagerStatus: [data.CaseManagerStatus || ''],
      caseManagerCategory: [data.CaseManagerCategory || ''],
            caseManagerUpdate: [data.CaseManagerUpdate || new Date()],
      caseManagerRemarks: [data.CaseManagerRemarks || '']
    });
  }

  save() {
  
    const formValue = this.callForm.value;
    const payload = {
      ...formValue,
      caseManagerUpdate: new Date(new Date().getTime() + (3 * 60 * 60 * 1000))
    };
    this.dialogRef.close(payload);
  }

  close() {
    this.dialogRef.close();
  }
}
