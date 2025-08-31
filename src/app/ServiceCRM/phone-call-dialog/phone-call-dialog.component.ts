import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../services/authentication-service/authentication-service.component';

@Component({
  selector: 'app-phone-call-dialog',
  templateUrl: './phone-call-dialog.component.html',
  styleUrls: ['./phone-call-dialog.component.scss']
})
export class PhoneCallDialogComponent implements OnInit {
  profilePictureUrl: string = '';
  userName: string = '';
  adUser: string = '';

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
    private authenticationService: AuthenticationService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    // ✅ read from lowerCamel first, fallback to PascalCase
    this.callForm = this.fb.group({
      caseManagerStatus: [data?.caseManagerStatus ?? data?.CaseManagerStatus ?? '', Validators.required],
      caseManagerCategory: [data?.caseManagerCategory ?? data?.CaseManagerCategory ?? ''],
      caseManagerUpdate: [data?.caseManagerUpdate ?? data?.CaseManagerUpdate ?? new Date()],
      caseManagerRemarks: [data?.caseManagerRemarks ?? data?.CaseManagerRemarks ?? '']
    });
  }

  ngOnInit(): void {
    this.authenticationService.getAuthentication().subscribe(
      (response) => {
        this.adUser = (response.message.split('\\')[1] || '').toUpperCase();
        this.getUserDetailsFromDBByUserName(this.adUser);
      },
      (error) => {
        console.error('❌ Authentication Failed:', error);
      }
    );
  }

  getUserDetailsFromDBByUserName(username: string): void {
    this.http
      .get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username}`)
      .subscribe(
        (data) => {
          this.userName = data.UserName;
          this.profilePictureUrl = data.ProfilePicture
            ? (data.ProfilePicture.startsWith('http') ? data.ProfilePicture : `${environment.apiUrl}${data.ProfilePicture}`)
            : 'assets/default-user.png';
        },
        (error) => {
          console.error('❌ Error fetching employee info:', error);
        }
      );
  }

  save() {
    const formValue = this.callForm.value;

    // base (lowerCamel) fields
    const base = {
      caseNumber: this.data?.caseNumber ?? this.data?.CaseNumber ?? '',
      caseManagerStatus: formValue.caseManagerStatus,
      caseManagerCategory: formValue.caseManagerCategory,
      caseManagerUpdate: new Date(Date.now() + 3 * 60 * 60 * 1000),
      caseManagerRemarks: formValue.caseManagerRemarks,
      caseManagerUserName: this.adUser
    };

    // legacy duplicates (PascalCase) for compatibility
    const legacy = {
      CaseNumber: base.caseNumber,
      CaseManagerStatus: base.caseManagerStatus,
      CaseManagerCategory: base.caseManagerCategory,
      CaseManagerUpdate: base.caseManagerUpdate,
      CaseManagerRemarks: base.caseManagerRemarks,
      CaseManagerUserName: base.caseManagerUserName
    };

    const payload = { ...base, ...legacy };

    this.dialogRef.close(payload);
  }

  close() {
    this.dialogRef.close();
  }
}
