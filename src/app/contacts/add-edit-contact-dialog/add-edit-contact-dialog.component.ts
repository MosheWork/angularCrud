import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-edit-contact-dialog',
  templateUrl: './add-edit-contact-dialog.component.html',
  styleUrls: ['./add-edit-contact-dialog.component.scss']
})
export class AddEditContactDialogComponent implements OnInit {
  contactForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddEditContactDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.contactForm = this.fb.group({
      id: [this.data.contact?.Id || this.data.contact?.id || null], // Ensure ID is properly set
      CompanyName: [this.data.contact?.CompanyName || '', Validators.required],
      Name: [this.data.contact?.Name || '', Validators.required],
      Position: [this.data.contact?.Position || ''],
      Phone: [this.data.contact?.Phone || ''],
      Email: [this.data.contact?.Email || ''],
      Description: [this.data.contact?.Description || ''],
      DeptInHospital: [this.data.contact?.DeptInHospital || ''], // New field
      Active: [this.data.contact?.Active !== undefined ? this.data.contact.Active : true]
    });
  }

  ngOnInit(): void { }

  onSave(): void {
    if (this.contactForm.valid) {
      this.dialogRef.close(this.contactForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
