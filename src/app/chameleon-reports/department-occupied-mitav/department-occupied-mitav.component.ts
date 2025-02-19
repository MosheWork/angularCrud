import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core'; // Import AfterViewInit
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

import html2canvas from 'html2canvas';

@Component({
  selector: 'app-department-occupied-mitav',
  templateUrl: './department-occupied-mitav.component.html',
  styleUrls: ['./department-occupied-mitav.component.scss'],
})
export class DepartmentOccupiedMitavComponent implements OnInit {
  Title1: string = '  ';
  Title2: string = 'סה"כ מטופלים: ';
  titleUnit: string = 'תפוסת מחלקה לדוח מיתב ';
  totalResults: number = 0;
  isLoading: boolean = true;
  filteredData: any[] = [];
  physiotherapyStats: string = '';
  mobilityStats: string = '';
  walkingStats: string = '';

  mobilityAtReceptionStats: string = '';
  functionalStateStats: string = '';
  datesWithBothShiftsStats: string = '';
  
   
  
    // ✅ Add multiple images for the slideshow
    loadingImages: string[] = [
      'assets/poriagood1.jfif',
      'assets/poriagood2.jfif',
      'assets/poria icon.jpg',
      'assets/poriagood3.jfif'
    ];
    currentImageIndex: number = 0;
  
  displayedColumns: string[] = [
     'UnitName', 'AdmissionNo', 'PName', 'Room',  'Age','MobilityAtReception', 'FunctionalStateExecution', 'MobilityAssessment', 'MobilityAssessmentDate', 
    'PhysiotherapyConsultation', 'WalkingPrescription', 'DatesWithBothShifts',
    //,'BedName',
   
  ];
  columnLabels: { [key: string]: string } = {
    AdmissionNo: 'מספר מקרה ',
    PName: 'שם המטופל',
    UnitName: 'שם המחלקה',
    Room: 'חדר',
    BedName: 'מיטה',
    Age: 'גיל',
    PhysiotherapyConsultation: 'הזמנת ייעוץ פיזיותרפיה',
    MobilityAssessment: 'הערכת ניידות',
    WalkingPrescription: 'מרשם הליכה',
    MobilityAssessmentDate: 'תאריך הערכת ניידות',  // ✅ Ensure it's unique
    MobilityAtReception: 'ניידות בקבלה',
    FunctionalStateExecution: 'מצב תפקודי',
    DatesWithBothShifts: 'תיעוד הליכה (יעד 70%)'
  };
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  unitOptions: string[] = []; // Stores unique UnitName options for the dropdown

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('pdfTable', { static: false }) pdfTable!: ElementRef;

  filterForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.fb.group({
      globalFilter: [''],
      unitFilter: [''], // Filter control for UnitName
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilterListeners();
    this.startImageRotation();
  }

  loadData(): void {
    this.isLoading = true; // ✅ Show spinner when data is loading
  
    this.http.get<any[]>(`${environment.apiUrl}DepartmentOccupiedMITAV`).subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource(data);
      
        this.totalResults = data.length;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
        // Extract unique UnitName values for the dropdown
        this.unitOptions = [...new Set(data.map((item) => item.UnitName))].sort();
        this.filteredData = [...data];
        // Set up the filter predicate
        this.dataSource.filterPredicate = this.customFilterPredicate();
  
        // Update counts after loading data
        this.updateCounts(data);
  
        this.isLoading = false; // ✅ Hide spinner after loading data
      },
      (error) => {
        console.error('Error fetching data', error);
        this.isLoading = false; // ✅ Hide spinner even if there's an error
      }
    );
  }
  

  setupFilterListeners(): void {
    this.filterForm.get('globalFilter')?.valueChanges.subscribe(() => this.applyFilter());
    this.filterForm.get('unitFilter')?.valueChanges.subscribe(() => this.applyFilter());
  }

  applyFilter(): void {
    const globalFilterValue = this.filterForm.get('globalFilter')?.value?.trim().toLowerCase() || '';
    const unitFilterValue = this.filterForm.get('unitFilter')?.value || '';
  
    // Update the filter string with a combination of global and unit filters
    this.dataSource.filter = JSON.stringify({ global: globalFilterValue, unit: unitFilterValue });
  
    // Update counts based on filtered data
    this.updateCounts(this.dataSource.filteredData);
  }
  

  customFilterPredicate(): (data: any, filter: string) => boolean {
    return (data, filter) => {
      const filterObject = JSON.parse(filter);
      const globalFilter = filterObject.global;
      const unitFilter = filterObject.unit;

      const matchesGlobalFilter = !globalFilter || JSON.stringify(data).toLowerCase().includes(globalFilter);
      const matchesUnitFilter = !unitFilter || data.UnitName === unitFilter;

      return matchesGlobalFilter && matchesUnitFilter;
    };
  }

  resetFilters(): void {
    // Reset all filter controls
    this.filterForm.reset();
    this.filterForm.patchValue({
      globalFilter: '',
      unitFilter: '',
    });
  
    // Ensure the filterPredicate processes the reset
    this.applyFilter();
  
    // Update counts after resetting filters
    this.updateCounts(this.dataSource.filteredData);
  }
  

  getColumnLabel(column: string): string {
    return this.columnLabels[column] || column;
  }
  updateCounts(data: any[]): void {
    const total = data.length; // Recalculate total patients from the filtered data

    // ✅ Extract numeric values from MobilityAssessment and filter for 2 or 3
    const mobility2or3 = data.filter(item => {
        const match = item.MobilityAssessment.match(/(\d+)$/); // Extract the number
        const mobilityValue = match ? parseInt(match[1], 10) : null;
        return mobilityValue === 2 || mobilityValue === 3;
    });

    const totalMobility2or3 = mobility2or3.length;

    // ✅ Physiotherapy Consultation (only for MobilityAssessment = 2 or 3)
    const physiotherapyYes = mobility2or3.filter(item => item.PhysiotherapyConsultation === 'כן').length;
    this.physiotherapyStats = `הזמנת ייעוץ פיזיותרפיה: ${physiotherapyYes}/${totalMobility2or3} (${totalMobility2or3 > 0 ? ((physiotherapyYes / totalMobility2or3) * 100).toFixed(2) : '0'}%)`;

    // ✅ Walking Prescription (only for MobilityAssessment = 2 or 3)
    const walkingYes = mobility2or3.filter(item => item.WalkingPrescription === 'כן').length;
    this.walkingStats = `מרשם הליכה: ${walkingYes}/${totalMobility2or3} (${totalMobility2or3 > 0 ? ((walkingYes / totalMobility2or3) * 100).toFixed(2) : '0'}%)`;

    // ✅ Mobility Assessment (exclude "אין תיעוד" from count)
    const mobilityValid = data.filter(item => item.MobilityAssessment !== 'אין תיעוד').length;
    this.mobilityStats = `הערכת ניידות: ${mobilityValid}/${total} (${((mobilityValid / total) * 100).toFixed(2)}%)`;

    // ✅ Mobility at Reception stats
    const mobilityAtReceptionValid = data.filter(item => item.MobilityAtReception !== 'אין תיעוד').length;
    this.mobilityAtReceptionStats = `ניידות בקבלה: ${mobilityAtReceptionValid}/${total} (${((mobilityAtReceptionValid / total) * 100).toFixed(2)}%)`;

  // ✅ Functional State Execution: Count only "בוצע" (Exclude "לא בוצע")
  const functionalStateValid = data.filter(item => item.FunctionalStateExecution === 'בוצע').length;
  this.functionalStateStats = `מצב תפקודי: ${functionalStateValid}/${total} (${((functionalStateValid / total) * 100).toFixed(2)}%)`;
    // ✅ Dates With Both Shifts stats
    // ✅ Total Recorded Walking Days
    const totalRecordedWalkingDays = data.reduce((sum, item) => sum + (item.DatesWithBothShifts || 0), 0);

    // ✅ Total Days in Hospital
    const totalDaysInHospital = data.reduce((sum, item) => sum + (item.TotalDaysInHospital || 1), 0); // Avoid division by zero

    // ✅ Calculate Walking Documentation Percentage
    const walkingPercentage = totalDaysInHospital > 0
        ? (totalRecordedWalkingDays / totalDaysInHospital) * 100
        : 0;

    this.datesWithBothShiftsStats = `תיעוד הליכה (יעד 70%): ${totalRecordedWalkingDays}/${totalDaysInHospital} (${walkingPercentage.toFixed(2)}%)`;
}



  startImageRotation(): void {
    setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.loadingImages.length;
    }, 3000); // ✅ Change image every 5 seconds
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator && this.sort) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    });
    
}
  // ✅ Export Filtered Data to Excel with Hebrew Column Headers
  exportToExcel() {
    // ✅ Use filtered data instead of full dataset
    const dataToExport = this.dataSource.filteredData.length ? this.dataSource.filteredData : this.filteredData;
  
    if (!dataToExport.length) {
      console.warn('No data available to export.');
      return;
    }
  
    // ✅ Define Hebrew column headers
    const columnHeaders: { [key: string]: string } = {
      AdmissionNo: 'מספר מקרה',
      PName: 'שם המטופל',
      UnitName: 'מחלקה',
      Room: 'חדר',
      BedName: 'מיטה',
      Age: 'גיל',
      PhysiotherapyConsultation: 'הזמנת ייעוץ פיזיותרפיה',
      MobilityAssessment: 'הערכת ניידות',
      WalkingPrescription: 'מרשם להליכה',
      MobilityAssessmentDate: 'תאריך הערכת ניידות',
      MobilityAtReception: 'ניידות בקבלה',
      FunctionalStateExecution: 'מצב תפקודי',
      DatesWithBothShifts: 'תיעוד הליכה (יעד 70%)'
    };
  
    // ✅ Convert filtered data to Hebrew format
    const formattedData = dataToExport.map((item: any) => {
      let newItem: { [key: string]: any } = {};
      Object.keys(columnHeaders).forEach(key => {
        newItem[columnHeaders[key]] = item[key] ?? ''; // ✅ Assign Hebrew names, prevent undefined
      });
      return newItem;
    });
  
    // ✅ Create Excel sheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = { Sheets: { 'פילוח מחלקתי': worksheet }, SheetNames: ['פילוח מחלקתי'] };
  
    // ✅ Export file
    XLSX.writeFile(workbook, 'פילוח_מחלקתי.xlsx');
  }
  exportToPDF(): void {
     // Check if pdfTable is available *before* using it (THIS IS STILL IMPORTANT)
  if (!this.pdfTable || !this.pdfTable.nativeElement) {
    console.error('❌ Error: Table reference not found! Ensure #pdfTable exists in the HTML.');
    return; // Stop execution if not found
  }
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
  
      // ✅ Clone the table and append it to a temporary container
      const pdfContainer = document.createElement('div');
      pdfContainer.innerHTML = `
        <div dir="rtl" style="padding: 20px; font-size: 16px;">
          ${this.pdfTable.nativeElement.innerHTML}
        </div>`;
      document.body.appendChild(pdfContainer);
  
      html2canvas(pdfContainer, { scale: 2 })
        .then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pdf.internal.pageSize.getWidth();
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
          pdf.addImage(imgData, 'PNG', 0, 20, imgWidth, imgHeight);
          pdf.save('תפוסת_מחלקה.pdf');
  
          pdfContainer.remove();
        })
        .catch((error) => {
          console.error('❌ Error generating PDF:', error);
          pdfContainer.remove();
        });
    
  }
  
  
  // ✅ Utility function: Convert ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach(byte => (binary += String.fromCharCode(byte)));
    return btoa(binary);
  }
  
} 
  
