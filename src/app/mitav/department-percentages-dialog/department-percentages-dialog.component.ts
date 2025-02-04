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
    
    totalMobilityPercentage: number = 0; // Add a property to store the passed percentage
  
    constructor(@Inject(MAT_DIALOG_DATA) public data: { 
      percentages: { 
        unitName: string; 
        percentage: number; 
        mobilityGrades: number[]; 
        recommendations: string[];
        consultationStatuses: string[]; 
        cognitiveStates: string[]; 
        mobilityStates: string[];  
        basicStates: string[];     
      }[], 
      totalMobilityPercentage: number, // Accept the percentage from the parent
    }) {
      this.totalMobilityPercentage = data.totalMobilityPercentage; // Assign the value
    }

  ngOnInit(): void {
    this.calculateAverages();
  
    // Use the total percentage from the parent component
    const totalPercentage = this.data.totalMobilityPercentage;
    console.log('Total Mobility Percentage from Parent:', totalPercentage);
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
      const yesConsultationCount = dept.consultationStatuses.filter(status => status === 'Yes').length;
      const totalConsultationCases = dept.consultationStatuses.length;
      const consultationPercentage = totalConsultationCases > 0
        ? `${yesConsultationCount}/${totalConsultationCases} (${((yesConsultationCount / totalConsultationCases) * 100).toFixed(1)}%)`
        : '0/0 (0%)'; // Default for empty or missing data
  
      return {
        unitName: dept.unitName,
        percentage: dept.percentage,
        avgMobilityGrade: validMobilityCount,
        formattedMobilityData: `${validMobilityCount}/${allCases} (${mobilityPercentage.toFixed(1)}%)`,
        formattedRecommendationData: `${validRecords}/${allCases} (${recommendationPercentage.toFixed(1)}%)`,
        functionalState: `${validFunctionalCount}/${allCases} (${functionalStatePercentage.toFixed(1)}%)`,
        consultationPercentage,
      };
    });
  
    // Add totals row
    const totalPercentage = this.departmentData.reduce((sum, dept) => sum + dept.percentage, 0) / this.departmentData.length;
    const totalMobilityCount = this.departmentData.reduce((sum, dept) => sum + dept.avgMobilityGrade, 0);
    const totalValidRecords = this.departmentData.reduce((sum, dept) => {
      const values = dept.formattedRecommendationData.split('/');
      const numericValue = values[0] ? parseInt(values[0], 10) : 0;
      return sum + numericValue;
    }, 0);
    const totalCases = this.departmentData.reduce((sum, dept) => {
      const values = dept.formattedRecommendationData.split('/');
      const numericValue = values[1] ? parseInt(values[1].split(' ')[0], 10) : 0;
      return sum + numericValue;
    }, 0);
    const totalFunctionalCount = this.departmentData.reduce((sum, dept) => {
      const values = dept.functionalState.split('/');
      const numericValue = values[0] ? parseInt(values[0], 10) : 0;
      return sum + numericValue;
    }, 0);
    const totalYesConsultations = this.departmentData.reduce((sum, dept) => {
      const consultationValues = dept.consultationPercentage.split('/');
      const yesCount = consultationValues[0] ? parseInt(consultationValues[0], 10) : 0;
      return sum + yesCount;
    }, 0);
    const totalConsultationCases = this.departmentData.reduce((sum, dept) => {
      const consultationValues = dept.consultationPercentage.split('/');
      const caseCount = consultationValues[1] ? parseInt(consultationValues[1].split(' ')[0], 10) : 0;
      return sum + caseCount;
    }, 0);
  
    const consultationPercentageTotal = totalConsultationCases > 0
      ? `${totalYesConsultations}/${totalConsultationCases} (${((totalYesConsultations / totalConsultationCases) * 100).toFixed(1)}%)`
      : '0/0 (0%)';
  
    this.departmentData.push({
      unitName: 'סה"כ', // Hebrew for Total
      percentage: totalPercentage,
      avgMobilityGrade: totalMobilityCount,
      formattedMobilityData: `${totalMobilityCount}/${totalCases} (${((totalMobilityCount / totalCases) * 100).toFixed(1)}%)`,
      formattedRecommendationData: `${totalValidRecords}/${totalCases} (${((totalValidRecords / totalCases) * 100).toFixed(1)}%)`,
      functionalState: `${totalFunctionalCount}/${totalCases} (${((totalFunctionalCount / totalCases) * 100).toFixed(1)}%)`,
      consultationPercentage: consultationPercentageTotal, // Correct total for consultation status
    });
  }
  
  
  
  
  
  
  
}
