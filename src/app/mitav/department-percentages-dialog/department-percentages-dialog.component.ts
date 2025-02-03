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
    // Calculate total records (all rows, including rows with missing grades)
    const totalRecords = dept.mobilityGrades.length + 1; // Include the empty row with no grade manually

    // Count valid MobilityGrade entries (valid numbers only)
    const validGrades = dept.mobilityGrades.filter(g => g !== null && g !== undefined && !isNaN(g));
    const totalValidGrades = validGrades.length;

    // Calculate the percentage of valid grades
    const percentageValid = totalRecords > 0 ? (totalValidGrades / totalRecords) * 100 : 0;

    // Format the data for display
    return {
      unitName: dept.unitName,
      percentage: dept.percentage, // Existing department percentage
      avgMobilityGrade: totalValidGrades, // Store valid grades as a raw number
      formattedMobilityData: `${totalValidGrades}/${totalRecords} (${percentageValid.toFixed(1)}%)` // Format: "X/Y (Z%)"
    };
  });
}




  
  
  
}
