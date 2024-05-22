import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-digital-form',
  templateUrl: './digital-form.component.html',
  styleUrls: ['./digital-form.component.scss']
})
export class DigitalFormComponent implements OnInit {
  digitalForm: FormGroup;
  isSigned = [false, false, false];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.digitalForm = this.fb.group({
      person1: [''],
      person2: [''],
      person3: ['']
    });
  }

  ngOnInit(): void { }

  onSubmit() {
    const formData = this.digitalForm.value;
    this.http.post('/api/signatures', formData).subscribe(response => {
      this.updateSignStatus(response);
    });
  }

  updateSignStatus(response: any) {
    this.isSigned = response.signStatus;
  }
}
