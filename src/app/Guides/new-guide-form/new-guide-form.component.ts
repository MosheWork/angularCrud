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
  categories: any[] = [];

  constructor(private http: HttpClient, private formBuilder: FormBuilder) {
    this.guideForm = this.formBuilder.group({
      title: new FormControl('', Validators.required),
      createdBy: new FormControl(''),
      categoryId: new FormControl('', Validators.required),
      sections: this.formBuilder.array([])
    });
  }

  ngOnInit() {
    this.fetchCategories();
  }

  get sections(): FormArray {
    return this.guideForm.get('sections') as FormArray;
  }

 

  addSection(sectionType: string): void {
    const section = this.createSection(sectionType);
    this.sections.push(section);
  }

  createSection(type: string): FormGroup {
    const baseSection = {
      position: new FormControl((this.sections.length || 0) + 1, Validators.required)
    };

    if (type === 'Text') {
      return this.formBuilder.group({
        ...baseSection,
        type: new FormControl('Text', Validators.required),
        textContent: new FormControl('')
      });
    } else if (type === 'Picture') {
      return this.formBuilder.group({
        ...baseSection,
        type: new FormControl('Picture', Validators.required),
        imageFile: new FormControl(null),
        imageSrc: new FormControl(null)
      });
    } else {
      throw new Error(`Unsupported section type: ${type}`);
    }
}


 

  onFileSelect(event: any, sectionIndex: number): void {
    const file = event?.target?.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.sections.at(sectionIndex)?.patchValue({ imageSrc: reader.result });
      };
      reader.readAsDataURL(file);
      this.sections.at(sectionIndex)?.patchValue({ imageFile: file });
    }
  }

  onSubmit(): void {
    if (!this.guideForm.valid) {
      console.error('Form is not valid');
      alert('Please fill all required fields');
      return;
    }
    const formData = new FormData();
    formData.append('title', this.guideForm.get('title')?.value ?? '');
    formData.append('createdBy', this.guideForm.get('createdBy')?.value ?? '');
    formData.append('categoryId', this.guideForm.get('categoryId')?.value ?? '');

    this.sections.controls.forEach((section, index) => {
      const type = section.get('type')?.value ?? 'Text';
      formData.append(`sections[${index}].position`, section.get('position')?.value.toString() ?? '0');
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

  fetchCategories(): void {
    this.http.get<any[]>(`${environment.apiUrl}GuidesAPI/GetCategories`).subscribe(data => {
      this.categories = data || [];
    }, error => {
      console.error('Error fetching categories:', error);
    });
  }
}
