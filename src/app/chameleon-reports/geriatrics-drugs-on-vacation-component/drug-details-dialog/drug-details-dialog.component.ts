import { Component, Inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-drug-details-dialog',
  templateUrl: './drug-details-dialog.component.html',
  styleUrls: ['./drug-details-dialog.component.scss'],
})
export class DrugDetailsDialogComponent implements AfterViewInit {
  displayedColumns: string[] = ['select', 'Way_Of_Giving', 'Drugs_Text', 'FrequencyText', 'SpecificTime'];
  dataSource: any[] = [];

  @ViewChild('pdfTable', { static: false }) pdfTable!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<DrugDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log('Dialog data received:', data);

    // Ensure data contains drugDetails array
    const drugDetails = Array.isArray(data.drugDetails) ? data.drugDetails : [];
    this.dataSource = drugDetails.map((item: any) => ({ ...item, selected: false }));
  }

  ngAfterViewInit() {
    // Ensure the table is rendered before using `html2canvas`.
    console.log('Table is ready:', this.pdfTable);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  toggleAllRows(event: any): void {
    const checked = event.checked;
    this.dataSource.forEach((row) => (row.selected = checked));
  }

  isAllSelected(): boolean {
    return this.dataSource.every((row) => row.selected);
  }

  hasPartialSelection(): boolean {
    return this.dataSource.some((row) => row.selected) && !this.isAllSelected();
  }

  exportAsPDF(): void {
    const selectedRows = this.dataSource.filter((row) => row.selected);
  
    if (selectedRows.length === 0) {
      alert('נא לבחור שורה אחת להדפסה לפחות');
      return;
    }
  
    const { Id_Num, First_Name, Last_Name, Admission_No, Father_Name } = this.data.patientDetails;
    const now = new Date();
    const releaseDate = now.toLocaleDateString('he-IL');
    const releaseTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  
    const tempTable = document.createElement('div');
    tempTable.innerHTML = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 30px; font-size: 16px; position: relative; min-height: 1120px;">
        <!-- Header: Large Icon and Personal Details -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      
  
          <!-- Personal Details -->
          <div style="text-align: right; font-size: 18px;">
            <p><strong>תעודת זהות:</strong> ${Id_Num}</p>
            <p><strong>שם פרטי:</strong> ${First_Name}</p>
            <p><strong>שם משפחה:</strong> ${Last_Name}</p>
            <p><strong>שם האב:</strong> ${Father_Name}</p>
            <p><strong>מספר מקרה:</strong> ${Admission_No}</p>
          </div>
          <!-- Large Icon -->
          <img src="assets/poria icon.jpg" alt="Icon" style="width: 200px; height: 100px;">
        </div>
  
        <!-- Title -->
        <h1 style="text-align: center; color: blue; font-size: 22px; margin-bottom: 20px;">
          הטיפול התרופתי לנטילה במהלך חופשה
        </h1>
  
        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr>
              <th style="background-color: blue; color: white; padding: 10px; border: 1px solid #ddd;">צורת מתן</th>
              <th style="background-color: blue; color: white; padding: 10px; border: 1px solid #ddd;">שם תרופה</th>
              <th style="background-color: blue; color: white; padding: 10px; border: 1px solid #ddd;">הנחיות</th>
              <th style="background-color: blue; color: white; padding: 10px; border: 1px solid #ddd;">שעות מתן</th>
            </tr>
          </thead>
          <tbody>
            ${selectedRows
              .map(
                (row) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${row.Way_Of_Giving}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${row.Drugs_Text}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${row.FrequencyText}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${row.SpecificTime}</td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
  
        <!-- Footer -->
        <div style="position: absolute; bottom: 30px; right: 30px; left: 30px; font-size: 18px;">
          <p style="display: flex; justify-content: space-between; align-items: center;">
            <span>תאריך שחרור: ${releaseDate} ${releaseTime}</span>
            <span>אחות משחררת: ___________________</span>
          </p>
        </div>
      </div>
    `;
  
    tempTable.style.position = 'absolute';
    tempTable.style.top = '-9999px';
    document.body.appendChild(tempTable);
  
    html2canvas(tempTable, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
    })
      .then((canvas) => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save('SelectedActiveDrugs.pdf');
  
        tempTable.remove();
      })
      .catch((error) => {
        console.error('Error rendering table to canvas:', error);
        tempTable.remove();
      });
  }
  
  
  
  
  
}
