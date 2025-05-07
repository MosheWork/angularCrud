import { Component, Inject,OnInit  } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
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
  UserName: string = '';
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
    @Inject(MAT_DIALOG_DATA) public data: any,    private authenticationService: AuthenticationService,  private http: HttpClient,

    private fb: FormBuilder
  ) {
    this.callForm = this.fb.group({
      caseManagerStatus: [data.CaseManagerStatus || '', Validators.required],
      caseManagerCategory: [data.CaseManagerCategory || ''],
            caseManagerUpdate: [data.CaseManagerUpdate || new Date()],
      caseManagerRemarks: [data.CaseManagerRemarks || '']
    });
  }
  ngOnInit(): void {
    this.authenticationService.getAuthentication().subscribe(
      (response) => {
        this.adUser = response.message.split('\\')[1].toUpperCase();
        console.log("🧑‍💼 AD User:", this.adUser);
  
        // ✅ Now only fetch user details AFTER adUser is available
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
        
        console.log("📸 Profile Picture URL:", this.profilePictureUrl);
      },
      (error) => {
        console.error('❌ Error fetching employee info:', error);
      }
    );
  }
  
  save() {
    const formValue = this.callForm.value;
    const payload = {
      ...formValue,
      caseManagerUpdate: new Date(new Date().getTime() + (3 * 60 * 60 * 1000)),
      caseManagerUserName: this.adUser, // ✅ This will now be "MOSHEM"
      CaseNumber: this.data.CaseNumber
    };
    this.dialogRef.close(payload);
    console.log("Payload:" + payload)
  }

  close() {
    this.dialogRef.close();
  }
  
}
