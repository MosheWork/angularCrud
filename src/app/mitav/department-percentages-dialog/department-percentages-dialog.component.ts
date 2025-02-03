import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-department-percentages-dialog',
  templateUrl: './department-percentages-dialog.component.html',
  styleUrls: ['./department-percentages-dialog.component.scss'],
})
export class DepartmentPercentagesDialogComponent implements OnInit {
  departmentData: { 
    unitName: string; 
    percentage: number; 
    avgMobilityGrade: number; 
    formattedMobilityData: string; 
    formattedRecommendationData: string; 
  }[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { 
    percentages: { 
      unitName: string; 
      percentage: number; 
      mobilityGrades: number[]; 
      recommendations: string[];
    }[] 
  }) {}

  ngOnInit(): void {
    this.calculateAverages();
  }

  // חישוב הערכת ניידות MobilityGrade
  calculateAverages(): void {
    this.departmentData = this.data.percentages.map(dept => {
      const allCases = dept.recommendations.length;

      // Filter valid recommendations (excluding "אין תיעוד")
      const validRecommendations = dept.recommendations.filter(r => 
        r !== null && r !== undefined && r !== '' && r !== 'אין תיעוד'
      );
      const validRecords = validRecommendations.length;

      // Calculate recommendation percentage
      const recommendationPercentage = allCases > 0 ? (validRecords / allCases) * 100 : 0;

      // Filter valid mobility grades (excluding "אין תיעוד" and ensuring numeric values)
      const validMobilityGrades = dept.mobilityGrades.filter(g => 
        g !== null && g !== undefined && !isNaN(g)
      );
      const validMobilityCount = validMobilityGrades.length;

      // Calculate mobility percentage
      const mobilityPercentage = allCases > 0 ? (validMobilityCount / allCases) * 100 : 0;

      return {
        unitName: dept.unitName,
        percentage: dept.percentage, // Existing department percentage
        avgMobilityGrade: validMobilityCount,
        formattedMobilityData: `${validMobilityCount}/${allCases} (${mobilityPercentage.toFixed(1)}%)`,
        formattedRecommendationData: `${validRecords}/${allCases} (${recommendationPercentage.toFixed(1)}%)`
      };
    });

    console.log('✅ Processed Department Data:', this.departmentData); // Debugging log
  }
}
