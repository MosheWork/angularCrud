import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-guide-form',
  templateUrl: './new-guide-form.component.html',
  styleUrls: ['./new-guide-form.component.scss']
})
export class NewGuideFormComponent implements OnInit, OnDestroy {
  guideForm: FormGroup;
  categories: any[] = [];
  loginUserName = '';

  constructor(private http: HttpClient, private formBuilder: FormBuilder, private router: Router) {
    this.loginUserName = localStorage.getItem('loginUserName') || '';
    this.guideForm = this.formBuilder.group({
      title: new FormControl('', Validators.required),
      createdBy: new FormControl(this.loginUserName),
      categoryId: new FormControl('', Validators.required),
      sections: this.formBuilder.array([])
    });

    this.handlePaste = this.handlePaste.bind(this);
  }

  ngOnInit() {
    this.fetchCategories();
    document.title = 'הקמת מדריך חדש';
    this.loginUserName = localStorage.getItem('loginUserName') || '';
    this.setupPasteListener();
  }

  ngOnDestroy(): void {
    window.removeEventListener('paste', this.handlePaste as EventListener);
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

    this.http.post<{ guideId: number }>(`${environment.apiUrl}GuidesAPI/CreateGuide`, formData).subscribe({
      next: (response) => {
        console.log('Success!', response);
        alert('Guide submitted successfully!');
        this.router.navigate(['/guide', response.guideId]); // Navigate to the view guide page
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

  setupPasteListener(): void {
    window.addEventListener('paste', this.handlePaste as EventListener);
  }

  handlePaste(event: Event): void {
    const clipboardEvent = event as ClipboardEvent;
    const items = clipboardEvent.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            this.addImageToForm(blob);
            event.preventDefault(); // Prevent the default paste behavior
          }
        }
      }
    }
  }

  addImageToForm(blob: Blob): void {
    const newFile = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
    const lastSectionIndex = this.sections.controls.length - 1;
    const section = this.sections.at(lastSectionIndex) as FormGroup;

    section.patchValue({ imageFile: newFile });
    const reader = new FileReader();
    reader.onload = (e) => {
      section.get('imageSrc')?.setValue(reader.result);
    };
    reader.readAsDataURL(newFile);
  }

  moveSectionUp(index: number): void {
    if (index === 0) return;
    const currentSection = this.sections.at(index);
    const previousSection = this.sections.at(index - 1);
    this.sections.setControl(index, previousSection);
    this.sections.setControl(index - 1, currentSection);
    this.updatePositions();
  }

  moveSectionDown(index: number): void {
    if (index === this.sections.length - 1) return;
    const currentSection = this.sections.at(index);
    const nextSection = this.sections.at(index + 1);
    this.sections.setControl(index, nextSection);
    this.sections.setControl(index + 1, currentSection);
    this.updatePositions();
  }

  updatePositions(): void {
    this.sections.controls.forEach((control, index) => {
      control.get('position')?.setValue(index + 1);
    });
  }
}
