import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-new-guide-form',
  templateUrl: './new-guide-form.component.html',
  styleUrls: ['./new-guide-form.component.scss']
})
export class NewGuideFormComponent {
  guideForm: FormGroup;

  constructor(private http: HttpClient, private formBuilder: FormBuilder) {
    this.guideForm = this.formBuilder.group({
      title: new FormControl(''),
      createdBy: new FormControl(''),
      categoryId: new FormControl('', Validators.required),  // Added category selection
      sections: this.formBuilder.array([])
    });
    this.addSection(); // Initialize with one section
  }
  ngOnInit() {
    this.fetchCategories();
  }
  get sections(): FormArray {
    return this.guideForm.get('sections') as FormArray;
  }

  createSection(): FormGroup {
    return this.formBuilder.group({
      type: new FormControl('Text'),  // No validation
      imageFile: new FormControl(null),
      textContent: new FormControl(''),
      position: new FormControl(this.sections.length + 1),
      imageSrc: new FormControl(null)  // Control to store the image source
    });
  }

  addSection(): void {
    this.sections.push(this.createSection());
  }

  onFileSelect(event: any, sectionIndex: number): void {
    const file = event.target.files?.[0];
    if (file) {
      this.sections.at(sectionIndex).get('imageFile')?.setValue(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.sections.at(sectionIndex).get('imageSrc')?.setValue(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    const formData = new FormData();
    formData.append('title', this.guideForm.get('title')?.value ?? '');
    formData.append('createdBy', this.guideForm.get('createdBy')?.value ?? '');
    formData.append('categoryId', this.guideForm.get('categoryId')?.value ?? '');  // Add category ID to the form data


    this.sections.controls.forEach((section, index) => {
      formData.append(`sections[${index}].position`, section.get('position')?.value.toString() ?? '0');
      const type = section.get('type')?.value ?? 'Text';
      formData.append(`sections[${index}].type`, type);

      if (type === 'Text') {
        const textContent = section.get('textContent')?.value ?? '';
        formData.append(`sections[${index}].textContent`, textContent);
      } else if (type === 'Picture') {
        const file = section.get('imageFile')?.value;
        if (file) {
          formData.append(`sections[${index}].imageFile`, file, file.name);
        }
      }
    });

    this.http.post(`${environment.apiUrl}GuidesAPI/CreateGuide`, formData).subscribe({
      next: (response) => {
        console.log('Success!', response);
        alert('Guide submitted successfully!');
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Failed to submit the guide: ' + error.message);
      }
    });
  }
  onSectionTypeChange(section: FormGroup, event: any): void {
    const type = event.value;
    if (type === 'Picture') {
      section.get('textContent')?.clearValidators();
      section.get('textContent')?.reset();
      section.get('imageFile')?.setValidators([Validators.required]);
    } else {
      section.get('textContent')?.setValidators([Validators.required]);
      section.get('imageFile')?.clearValidators();
      section.get('imageFile')?.reset();
    }
    section.get('textContent')?.updateValueAndValidity();
    section.get('imageFile')?.updateValueAndValidity();
  }
  categories: any[] = [];

fetchCategories() {
  this.http.get<any[]>(`${environment.apiUrl}GuidesAPI/GetCategories`).subscribe({
    next: (data) => {
      this.categories = data;
    },
    error: (error) => {
      console.error('Error fetching categories:', error);
    }
  });
}

  
}
