import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-new-guide-form',
  templateUrl: './new-guide-form.component.html',
  styleUrls: ['./new-guide-form.component.scss']
})
export class NewGuideFormComponent {
  guideForm: FormGroup;
  errorMessage: string = '';

  constructor(private http: HttpClient, private formBuilder: FormBuilder) {
    this.guideForm = this.formBuilder.group({
      title: new FormControl('', Validators.required),
      createdBy: new FormControl('', Validators.required),
      sections: this.formBuilder.array([])
    });
    this.addSection(); // Initialize with one section
  }

  get sections(): FormArray {
    return this.guideForm.get('sections') as FormArray;
  }

  createSection(): FormGroup {
    return this.formBuilder.group({
      type: new FormControl('Text', Validators.required),
      imageFile: new FormControl(null),
      textContent: new FormControl('', Validators.required),
      position: new FormControl(0, Validators.required)
    });
  }

  onFileSelect(event: any, sectionIndex: number): void {
    const file = event.target.files?.[0];
    this.sections.at(sectionIndex)?.get('imageFile')?.setValue(file);
  }

  addSection(): void {
    this.sections.push(this.createSection());
  }

  onSubmit(): void {
    const formData = new FormData();
    formData.append('title', this.guideForm.get('title')?.value ?? '');
    formData.append('createdBy', this.guideForm.get('createdBy')?.value ?? '');

    this.sections.controls.forEach((section, index) => {
      const type = section.get('type')?.value ?? 'Text';
      const position = section.get('position')?.value ?? 0;
      formData.append(`sections[${index}].position`, position.toString());
      formData.append(`sections[${index}].type`, type);

      if (type === 'Text') {
        const textContent = section.get('textContent')?.value ?? '';
        formData.append(`sections[${index}].textContent`, textContent);
      } else if (type === 'Picture') {
        const file = section.get('imageFile')?.value;
        if (file) {
          formData.append(`sections[${index}].imageFile`, file, file.name);
        } else {
          this.errorMessage = `Image file is missing for section ${index}`;
          console.error(this.errorMessage);
        }
      }
    });

    this.http.post(`${environment.apiUrl}GuidesAPI/CreateGuide`, formData).subscribe(
      response => console.log('Success!', response),
      error => {
        console.error('Error:', error);
        this.errorMessage = 'Failed to submit the guide.';
      }
    );
  }

  onSectionTypeChange(section: FormGroup): void {
    const typeControl = section.get('type');
    const textContentControl = section.get('textContent');
    const imageFileControl = section.get('imageFile');

    if (typeControl?.value === 'Picture') {
      textContentControl?.clearValidators();
      textContentControl?.reset();
      imageFileControl?.setValidators([Validators.required]);
    } else {
      textContentControl?.setValidators([Validators.required]);
      imageFileControl?.clearValidators();
      imageFileControl?.reset();
    }

    textContentControl?.updateValueAndValidity();
    imageFileControl?.updateValueAndValidity();
  }
}
