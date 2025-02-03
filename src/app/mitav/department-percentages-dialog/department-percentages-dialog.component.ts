import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-department-percentages-dialog',
  templateUrl: './department-percentages-dialog.component.html',
  styleUrls: ['./department-percentages-dialog.component.scss'],
})
export class DepartmentPercentagesDialogComponent implements OnInit {
  departmentData: { unitName: string; percentage: number; avgMobilityGrade: number }[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { percentages: { unitName: string; percentage: number; mobilityGrades: number[] }[] }) {}

  ngOnInit(): void {
    this.calculateAverageMobilityGrade();
  }
// חישוב הערכת ניידות MobilityGrade
calculateAverageMobilityGrade(): void {
  this.departmentData = this.data.percentages.map(dept => {
    // Total number of records for the department
    const totalRecords = dept.mobilityGrades.length;

    // Filter out valid MobilityGrade values (numbers only)
    const validGrades = dept.mobilityGrades.filter(g => g !== null && g !== undefined && !isNaN(g));
    const totalValidGrades = validGrades.length; // Count valid MobilityGrade entries

    // Calculate the percentage of valid MobilityGrade records
    const percentageValid = totalRecords > 0 ? (totalValidGrades / totalRecords) * 100 : 0;

    // Return both the raw number and the formatted string for display
    return {
      unitName: dept.unitName,
      percentage: dept.percentage, // Existing department percentage
      avgMobilityGrade: totalValidGrades, // Keep this as a number for consistency
      formattedMobilityData: `${totalValidGrades}/${totalRecords} (${percentageValid.toFixed(1)}%)` // Formatted string
    };
  });
}

  
  
  
}
