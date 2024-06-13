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
      companyName: [this.data.contact?.companyName || '', Validators.required],
      name: [this.data.contact?.name || '', Validators.required],
      position: [this.data.contact?.position || ''],
      phone: [this.data.contact?.phone || ''],
      email: [this.data.contact?.email || ''],
      description: [this.data.contact?.description || ''],
      deptInHospital: [this.data.contact?.deptInHospital || ''], // New field
      active: [this.data.contact?.active !== undefined ? this.data.contact.active : true]
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
