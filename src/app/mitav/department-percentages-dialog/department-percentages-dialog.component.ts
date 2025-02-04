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
    functionalState: string; // Add functional state data
    consultationPercentage: string; // Add consultation percentage
  }[] = [];
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: { 
    percentages: { 
      unitName: string; 
      percentage: number; 
      mobilityGrades: number[]; 
      recommendations: string[];
      consultationStatuses: string[]; // Add consultation statuses
      cognitiveStates: string[]; // Add cognitive states
      mobilityStates: string[];  // Add mobility states
      basicStates: string[];     // Add basic states
    }[] 
  }) {}

  ngOnInit(): void {
    this.calculateAverages();
   
  }

  isAboveThreshold(value: string | number, columnType: string): boolean {
    if (typeof value === 'string') {
      const percentageMatch = value.match(/(\d+(\.\d+)?)%/); // Extract numeric percentage from "XX.XX%"
      const numValue = percentageMatch ? parseFloat(percentageMatch[1]) : NaN;
  
      console.log(`Parsed Value for threshold check: ${numValue}, Column Type: ${columnType}`);
      if (isNaN(numValue)) return false;
  
      if (columnType === 'percentage') return numValue >= 50;
      return numValue >= 70;
    }
  
    return typeof value === 'number' && value >= (columnType === 'percentage' ? 50 : 70);
  }
  
  
  calculateAverages(): void {
    this.departmentData = this.data.percentages.map(dept => {
      console.log("Processing department:", dept.unitName);
      console.log("Raw consultationStatuses:", dept.consultationStatuses);
  
      const allCases = dept.recommendations.length;
  
      const isValid = (value: string | number) => 
        value !== null && value !== undefined && value !== '' && value !== 'אין תיעוד';
  
      // Count valid recommendations
      const validRecommendations = dept.recommendations.filter(r => isValid(r));
      const validRecords = validRecommendations.length;
      const recommendationPercentage = allCases > 0 ? (validRecords / allCases) * 100 : 0;
  
      // Count valid mobility grades
      const validMobilityGrades = dept.mobilityGrades.filter(g => isValid(g));
      const validMobilityCount = validMobilityGrades.length;
      const mobilityPercentage = allCases > 0 ? (validMobilityCount / allCases) * 100 : 0;
  
      // Functional State Calculation
      const validFunctionalStates = dept.cognitiveStates.map((_, index) => {
        return (isValid(dept.cognitiveStates[index]) || isValid(dept.mobilityStates[index]) || isValid(dept.basicStates[index])) ? 1 : 0;
      });
  
      const validFunctionalCount = validFunctionalStates.reduce((sum: number, count: number) => sum + count, 0);
      const functionalStatePercentage = allCases > 0 ? (validFunctionalCount / allCases) * 100 : 0;
  
      // Consultation Status Calculation
      if (!dept.consultationStatuses) {
        console.warn(`Missing consultationStatuses for department: ${dept.unitName}`);
      }
  
      const validConsultationStatuses = dept.consultationStatuses || [];
      console.log("Valid consultation statuses:", validConsultationStatuses);
  
      const yesConsultationCount = validConsultationStatuses.filter(status => status === 'Yes').length;
      const totalConsultationCases = validConsultationStatuses.length;
  
      console.log(`Yes Consultation Count: ${yesConsultationCount} / Total: ${totalConsultationCases}`);
  
      const consultationPercentage = totalConsultationCases > 0 
        ? `${yesConsultationCount}/${totalConsultationCases} (${((yesConsultationCount / totalConsultationCases) * 100).toFixed(1)}%)`
        : 'N/A';
  
      return {
        unitName: dept.unitName,
        percentage: dept.percentage,
        avgMobilityGrade: validMobilityCount,
        formattedMobilityData: `${validMobilityCount}/${allCases} (${mobilityPercentage.toFixed(1)}%)`,
        formattedRecommendationData: `${validRecords}/${allCases} (${recommendationPercentage.toFixed(1)}%)`,
        functionalState: `${validFunctionalCount}/${allCases} (${functionalStatePercentage.toFixed(1)}%)`,
        consultationPercentage,  // ✅ Make sure this is set correctly
      };
    });
  
    console.log('Processed Department Data:', this.departmentData);
  }
  
  
  
  
  
}
