import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'digital-form',
  templateUrl: './digital-form.component.html',
  styleUrls: ['./digital-form.component.scss']
})
export class DigitalFormComponent implements OnInit {
  approvalForm: FormGroup;
  departments: string[] = ['HR', 'IT', 'Finance', 'Marketing'];

  constructor(private fb: FormBuilder) {
    this.approvalForm = this.fb.group({
      employeeName: [''],
      employeeId: [''],
      department: [''],
      position: [''],
      approvals: this.fb.group({
        approver1: [false],
        approver2: [false],
        approver3: [false]
      })
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.approvalForm.valid) {
      console.log(this.approvalForm.value);
      // Add logic to handle form submission
    }
  }
}
