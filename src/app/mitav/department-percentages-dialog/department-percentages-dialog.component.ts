import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-department-percentages-dialog',
  templateUrl: './department-percentages-dialog.component.html',
  styleUrls: ['./department-percentages-dialog.component.scss'],
})
export class DepartmentPercentagesDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { percentages: { unitName: string; percentage: number }[] }
  ) {}
}
