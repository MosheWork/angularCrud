import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { environment } from 'environments/environment';

interface Guide {
  guideId: number;
  title: string;
  createdBy: string;
  createdDate: Date;
  sections: Section[];
}

interface Section {
  sectionId: number;
  position: number;
  textContent?: string;
  imagePath?: string;
  type?: string;
  createdBy: string;
}

@Component({
  selector: 'app-edit-guide-form',
  templateUrl: './edit-guide-form.component.html',
  styleUrls: ['./edit-guide-form.component.scss']
})
export class EditGuideFormComponent implements OnInit {
  guide!: Guide;
  editGuideForm!: FormGroup;
  loginUserName = '';
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '15rem',
    minHeight: '5rem',
    placeholder: 'Enter text here...',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [
      ['italic']
    ],
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h1',
      },
    ]
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.handlePaste = this.handlePaste.bind(this);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.fetchGuide(id);
    });
    this.setupForm();
    this.setupPasteListener();
    window.addEventListener('paste', this.handlePaste);
    document.title = 'עריכת מדריך ';
    this.loginUserName = localStorage.getItem('loginUserName') || '';
  }

  setupPasteListener(): void {
    window.addEventListener('paste', this.handlePaste.bind(this));
  }

  setupForm(): void {
    this.editGuideForm = this.formBuilder.group({
      title: ['', Validators.required],
      sections: this.formBuilder.array([])
    });
  }

  addImageToForm(blob: Blob): void {
    const newFile = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
    const lastSectionIndex = this.sectionsFormArray.controls.length - 1;
    const section = this.sectionsFormArray.at(lastSectionIndex) as FormGroup;

    section.patchValue({ imageFile: newFile });
    const reader = new FileReader();
    reader.onload = (e) => {
      section.get('imagePath')?.setValue(reader.result);
    };
    reader.readAsDataURL(newFile);
  }

  get sectionsFormArray(): FormArray {
    return this.editGuideForm.get('sections') as FormArray;
  }

  createSectionGroup(section?: Partial<Section>): FormGroup {
    return this.formBuilder.group({
      sectionId: [section?.sectionId],
      position: [section?.position, Validators.required],
      textContent: [section?.type === 'Text' ? section?.textContent : ''],
      imagePath: [section?.type === 'Picture' ? section?.imagePath : ''],
      imageFile: [null],
      type: [section?.type || 'Text'],
      createdBy: [section?.createdBy || '']
    });
  }

  fetchGuide(id: number): void {
    this.http.get<{ guide: Guide, sections: Section[] }>(`${environment.apiUrl}GuidesAPI/GetGuide/${id}`).subscribe({
      next: data => {
        if (!data || !data.guide) {
          console.error('No data or guide details returned for guide with ID:', id);
        } else {
          this.guide = data.guide;
          this.editGuideForm.patchValue({
            title: this.guide.title
          });
          data.sections.forEach(section => {
            const sectionFormGroup = this.createSectionGroup(section);
            this.sectionsFormArray.push(sectionFormGroup);
            if (section.type === 'Picture' && section.imagePath) {
              sectionFormGroup.get('imagePath')?.setValue(this.transformImagePath(section.imagePath));
            }
          });
        }
      },
      error: error => {
        console.error('Error fetching the guide with ID:', id, error);
      }
    });
  }

  addSection(type: 'Text' | 'Picture'): void {
    const newPosition = this.calculateNewPosition();
    const newSection = this.createSectionGroup({ type: type, position: newPosition });
    this.sectionsFormArray.push(newSection);
  }

  calculateNewPosition(): number {
    let highestPosition = 0;
    this.sectionsFormArray.controls.forEach((control) => {
      const position = control.get('position')?.value;
      if (position > highestPosition) {
        highestPosition = position;
      }
    });
    return highestPosition + 1;
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file && file instanceof File) {
      const section = this.sectionsFormArray.at(index) as FormGroup;
      section.patchValue({ imageFile: file });

      const reader = new FileReader();
      reader.onload = (e) => {
        section.get('imagePath')?.setValue(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  submitGuide(): void {
    const formData = new FormData();
    formData.append('guideId', this.guide.guideId.toString());
    formData.append('title', this.editGuideForm.get('title')?.value);
    formData.append('createdBy', this.guide.createdBy);

    this.sectionsFormArray.controls.forEach((sectionControl, index) => {
      const section = sectionControl as FormGroup;
      const sectionId = section.get('sectionId')?.value;
      const position = section.get('position')?.value;
      const type = section.get('type')?.value;
      const createdBy = section.get('createdBy')?.value;

      if (sectionId != null) formData.append(`sections[${index}].sectionId`, sectionId.toString());
      if (position != null) formData.append(`sections[${index}].position`, position.toString());
      formData.append(`sections[${index}].type`, type);

      if (type === 'Text') {
        const textContent = section.get('textContent')?.value;
        if (textContent != null) formData.append(`sections[${index}].textContent`, textContent);
      } else if (type === 'Picture') {
        const file = section.get('imageFile')?.value;
        if (file instanceof File) {
          formData.append(`sections[${index}].imageFile`, file, file.name);
        }
      }
    });

    this.http.post(`${environment.apiUrl}GuidesAPI/SaveGuide`, formData).subscribe({
      next: () => this.router.navigateByUrl('/guide-list'),
      error: error => console.error('Failed to update guide:', error)
    });
  }

  transformImagePath(imagePath: string): string {
    if (!imagePath) {
      return '';
    }
    const parts = imagePath.split('\\');
    const filename = parts.pop() || '';
    const encodedFilename = encodeURIComponent(filename);
    return `${environment.imageBaseUrl}/${encodedFilename}`;
  }

  moveSectionUp(index: number): void {
    if (index === 0) return;
    const currentSection = this.sectionsFormArray.at(index);
    const previousSection = this.sectionsFormArray.at(index - 1);
    this.sectionsFormArray.setControl(index, previousSection);
    this.sectionsFormArray.setControl(index - 1, currentSection);
    this.updatePositions();
  }

  moveSectionDown(index: number): void {
    if (index === this.sectionsFormArray.length - 1) return;
    const currentSection = this.sectionsFormArray.at(index);
    const nextSection = this.sectionsFormArray.at(index + 1);
    this.sectionsFormArray.setControl(index, nextSection);
    this.sectionsFormArray.setControl(index + 1, currentSection);
    this.updatePositions();
  }

  updatePositions(): void {
    this.sectionsFormArray.controls.forEach((control, index) => {
      control.get('position')?.setValue(index + 1);
    });
  }

  handlePaste = (event: Event): void => {
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

  ngOnDestroy(): void {
    window.removeEventListener('paste', this.handlePaste);
  }
}
