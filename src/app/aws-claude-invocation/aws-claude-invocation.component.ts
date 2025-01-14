import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-aws-claude-invocation',
  templateUrl: './aws-claude-invocation.component.html',
  styleUrls: ['./aws-claude-invocation.component.scss'],
})
export class AwsClaudeInvocationComponent {
  invokeForm: FormGroup;
  response: any;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.invokeForm = this.fb.group({
      Region_Name: ['', Validators.required],
      AWS_Access_Key_ID: ['', Validators.required],
      AWS_Secret_Access_Key: ['', Validators.required],
      ModelId: ['', Validators.required],
      Prompt: ['', Validators.required],
      Max_Tokens: ['1000', Validators.required],
    });
  }

  invokeModel() {
    const payload = this.invokeForm.value;

    this.http.post(`${environment.apiUrl}/BedrockModel/InvokeModel`, payload).subscribe(
      (res) => {
        this.response = res;
        console.log('API Response:', res);
      },
      (error) => {
        console.error('API Error:', error);
        this.response = { error: 'An error occurred while invoking the model.' };
      }
    );
  }
}
