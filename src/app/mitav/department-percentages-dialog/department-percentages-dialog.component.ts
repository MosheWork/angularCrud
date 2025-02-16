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
  
 // Filter recommendations where MobilityGrade is 2 or 3
 const filteredIndices = dept.mobilityGrades
 .map((grade, index) => (Number(grade) === 2 || Number(grade) === 3 ? index : -1))
 .filter(index => index !== -1);


console.log(`📊 Mobility Grades for ${dept.unitName}:`, dept.mobilityGrades);
console.log(`✅ Filtered Indices (MobilityGrade 2 or 3) for ${dept.unitName}:`, filteredIndices);

const filteredRecommendations = filteredIndices.map(index => dept.recommendations[index]);
console.log(`🔎 Filtered Recommendations for ${dept.unitName}:`, filteredRecommendations);

const totalValidRecordsByGrade = filteredRecommendations.filter(r => isValid(r)).length;
const totalCasesByGrade = filteredIndices.length;
console.log(`📌 Total Valid Records (MobilityGrade 2/3) for ${dept.unitName}: ${totalValidRecordsByGrade}`);
console.log(`📌 Total Cases (MobilityGrade 2/3) for ${dept.unitName}: ${totalCasesByGrade}`);

const recommendationPercentage = totalCasesByGrade > 0 
? (totalValidRecordsByGrade / totalCasesByGrade) * 100 
: 0;
  
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
  
     // Consultation Percentage Calculation (only for MobilityGrade 2 or 3)
const filteredConsultations = filteredIndices.map(index => dept.consultationStatuses[index]);
const yesConsultationCount = filteredConsultations.filter(status => status === 'Yes').length;
const consultationPercentage = totalCasesByGrade > 0
  ? `${yesConsultationCount}/${totalCasesByGrade} (${((yesConsultationCount / totalCasesByGrade) * 100).toFixed(1)}%)`
  : '0/0 (0%)';

      return {
        unitName: dept.unitName,
        percentage: dept.percentage,
        avgMobilityGrade: validMobilityCount,
        formattedMobilityData: `${validMobilityCount}/${allCases} (${mobilityPercentage.toFixed(1)}%)`,
        formattedRecommendationData: `${totalValidRecordsByGrade}/${totalCasesByGrade} (${((totalValidRecordsByGrade / totalCasesByGrade) * 100).toFixed(1)}%)`,
        functionalState: `${validFunctionalCount}/${allCases} (${functionalStatePercentage.toFixed(1)}%)`,
        consultationPercentage,
      };
    });
  
    // Add totals row
    const totalPercentage = this.departmentData.reduce((sum, dept) => sum + dept.percentage, 0) / this.departmentData.length;
    const totalMobilityCount = this.departmentData.reduce((sum, dept) => sum + dept.avgMobilityGrade, 0);
   const totalValidRecordsByGrade = this.departmentData.reduce((sum, dept) => {
  const values = dept.formattedRecommendationData.split('/');
  const numericValue = values[0] ? parseInt(values[0], 10) : 0;
  return sum + numericValue;
}, 0);

const totalCasesByGrade = this.departmentData.reduce((sum, dept) => {
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
      formattedMobilityData: `${totalMobilityCount}/${totalCasesByGrade} (${((totalMobilityCount / totalCasesByGrade) * 100).toFixed(1)}%)`,
      formattedRecommendationData: `${totalValidRecordsByGrade}/${totalCasesByGrade} (${((totalValidRecordsByGrade / totalCasesByGrade) * 100).toFixed(1)}%)`,
      functionalState: `${totalFunctionalCount}/${totalCasesByGrade} (${((totalFunctionalCount / totalCasesByGrade) * 100).toFixed(1)}%)`,
      consultationPercentage: consultationPercentageTotal, // Correct total for consultation status
    });
  }
  
  
  
  
  
  
  
}
