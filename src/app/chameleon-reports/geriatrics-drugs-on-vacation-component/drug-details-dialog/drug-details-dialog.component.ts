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
  displayedColumns: string[] = ['select', 'Way_Of_Giving', 'Drugs_Text', 'TimingString'];
  dataSource: any[] = [];

  @ViewChild('pdfTable', { static: false }) pdfTable!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<DrugDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.dataSource = data.map((item: any) => ({ ...item, selected: false })); // Add a `selected` property
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
  
    // Generate the table
    const tempTable = document.createElement('div');
    tempTable.innerHTML = `
      <style>
        .table-container {
          padding: 20px; /* Add padding around the table */
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          word-wrap: break-word; /* Ensure text wraps inside cells */
          white-space: normal; /* Allow multiline wrapping */
          line-height: 1.5; /* Add spacing between wrapped lines */
        }
        th {
          background-color: blue;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        tr:hover {
          background-color: #f1f1f1;
        }
      </style>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>צורת מתן</th>
              <th>שם התרופה</th>
              <th>תזמון</th>
            </tr>
          </thead>
          <tbody>
            ${selectedRows
              .map(
                (row) => `
              <tr>
                <td>${row.Way_Of_Giving}</td>
                <td>${row.Drugs_Text}</td>
                <td>${row.TimingString}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  
    // Append the tempTable to the body and hide it
    tempTable.style.position = 'absolute';
    tempTable.style.top = '-9999px';
    document.body.appendChild(tempTable);
  
    // Render the table to PDF
    html2canvas(tempTable, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
  
        let position = 30;
  
        // Add title to the PDF
        pdf.setFontSize(18);
        pdf.text('Active Drugs', pageWidth / 2, 20, { align: 'center' });
  
        // Add the table image to the PDF
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  
        pdf.save('SelectedActiveDrugs.pdf');
  
        // Remove the temporary table from the DOM
        tempTable.remove();
      })
      .catch((error) => {
        console.error('Error rendering table to canvas:', error);
        tempTable.remove(); // Ensure cleanup even on error
      });
  }
  
  
  
  
}
