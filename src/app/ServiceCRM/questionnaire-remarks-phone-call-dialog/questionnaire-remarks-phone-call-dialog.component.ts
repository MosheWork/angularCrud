import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../services/authentication-service/authentication-service.component';

@Component({
  selector: 'app-questionnaire-remarks-dialog',
  templateUrl: './questionnaire-remarks-phone-call-dialog.component.html',
  styleUrls: ['./questionnaire-remarks-phone-call-dialog.component.scss']
})
export class QuestionnaireRemarksPhoneCallDialogComponent implements OnInit {
  profilePictureUrl: string = '';
  UserName: string = '';
  adUser: string = '';

  form: FormGroup;
  categories: string[] = [
    ' ',
    'אובדן ציוד',
    'אחר',
    'בירור חיובים',
    'דחיית/ ביטול ניתוח',
    'הבעת תודה',
    'היעדר מידע והסברים',
    'זמני המתנה לבדיקה רופא/ה',
    'זמני המתנה למועד התור',
    'זמני המתנה לתוצאות בדיקה',
    'חניה',
    'טיפול מקצועי לקוי (לכאורה)',
    'יחס עובד - שלילי',
    'כשל במענה הטלפוני',
    'ליקוי ברשומה רפואית',
    'נושא חדש ממוקד',
    'שילוט'
  ];

  constructor(
    public dialogRef: MatDialogRef<QuestionnaireRemarksPhoneCallDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {
    this.form = this.fb.group({
      caseManagerStatus: [data.CaseManagerStatus || ''],
      caseManagerCategory: [data.CaseManagerCategory || ''],
      caseManagerRemarks: [data.CaseManagerRemarks || ''],
      managerRemarks: [data.ManagerRemarks || '']
    });
  }

  ngOnInit(): void {
    this.authenticationService.getAuthentication().subscribe(
      (response) => {
        this.adUser = response.message.split('\\')[1].toUpperCase();
        this.getUserDetailsFromDBByUserName(this.adUser);
      },
      (error) => {
        console.error('❌ Authentication Failed:', error);
      }
    );
  }

  getUserDetailsFromDBByUserName(username: string): void {
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username}`).subscribe(
      (data) => {
        this.UserName = data.UserName;
        this.profilePictureUrl = data.ProfilePicture
          ? data.ProfilePicture.startsWith('http')
            ? data.ProfilePicture
            : `${environment.apiUrl}${data.ProfilePicture}`
          : 'assets/default-user.png';
      },
      (error) => {
        console.error('❌ Error fetching employee info:', error);
      }
    );
  }

  save(): void {
    const formValue = this.form.value;
  
    const payload = {
      CaseManagerStatus: formValue.caseManagerStatus,
      CaseManagerCategory: formValue.caseManagerCategory,
      CaseManagerRemarks: formValue.caseManagerRemarks,
      ManagerRemarks: formValue.managerRemarks,
      EntryUser: this.adUser, // From Active Directory
      EntryDate: new Date(),
      CaseNumber: this.data.CaseNumber // primary key
    };
  
    this.dialogRef.close(payload); // send to parent component
  }
  

  close(): void {
    this.dialogRef.close();
  }
}
