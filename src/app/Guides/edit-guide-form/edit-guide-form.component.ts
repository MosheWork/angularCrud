import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
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

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.fetchGuide(id);
    });
    this.setupForm();
  }

  setupForm(): void {
    this.editGuideForm = this.formBuilder.group({
      title: ['', Validators.required],
      sections: this.formBuilder.array([])
    });
  }

  get sectionsFormArray(): FormArray {
    return this.editGuideForm.get('sections') as FormArray;
  }

  createSectionGroup(section?: Section): FormGroup {
    return this.formBuilder.group({
      sectionId: [section?.sectionId],
      position: [section?.position, Validators.required],
      textContent: [section?.textContent],
      imagePath: [section?.imagePath],
      imageFile: [null],
      type: [section?.type || 'Text'],
      createdBy: [section?.createdBy]
    });
  }

  fetchGuide(id: number): void {
    this.http.get<{guide: Guide, sections: Section[]}>(`${environment.apiUrl}GuidesAPI/GetGuide/${id}`).subscribe({
      next: data => {
        if (!data || !data.guide) {
          console.error('No data or guide details returned for guide with ID:', id);
        } else {
          console.log('Guide data received:', data);
          this.guide = data.guide;
          this.editGuideForm.patchValue({
            title: this.guide.title
          });
          data.sections.forEach(section => {
            this.sectionsFormArray.push(this.createSectionGroup(section));
          });
        }
      },
      error: error => {
        console.error('Error fetching the guide with ID:', id, error);
      }
    });
  }

  addSection(): void {
    this.sectionsFormArray.push(this.createSectionGroup());
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file && file instanceof File) {
      const section = this.sectionsFormArray.at(index) as FormGroup;
      section.patchValue({ imageFile: file });
      // Update image path to show the preview immediately
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
      formData.append(`sections[${index}].sectionId`, section.get('sectionId')?.value.toString());
      formData.append(`sections[${index}].position`, section.get('position')?.value.toString());
      formData.append(`sections[${index}].type`, section.get('type')?.value);
      formData.append(`sections[${index}].createdBy`, section.get('createdBy')?.value);

      if (section.get('type')?.value === 'Text') {
        formData.append(`sections[${index}].textContent`, section.get('textContent')?.value);
      } else if (section.get('type')?.value === 'Picture') {
        const file = section.get('imageFile')?.value;
        if (file && file instanceof File) {
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
}
