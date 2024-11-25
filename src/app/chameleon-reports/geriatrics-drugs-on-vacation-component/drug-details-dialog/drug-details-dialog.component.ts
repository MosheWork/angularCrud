import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-drug-details-dialog',
  templateUrl: './drug-details-dialog.component.html',
  styleUrls: ['./drug-details-dialog.component.scss'],
})
export class DrugDetailsDialogComponent implements OnInit {
  displayedColumns: string[] = ['Way_Of_Giving', 'Drugs_Text', 'TimingString'];
  dataSource: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DrugDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && Array.isArray(data)) {
      this.dataSource = data;
    }
  }

  ngOnInit(): void {
    console.log('Data passed to dialog:', this.data); // Log the data
    console.log('DataSource for table:', this.dataSource); // Log the data source used in the table
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
  generatePDF(): void {
    const doc = new jsPDF();
  
    // Add title
    doc.setFontSize(18);
    doc.text('Active Drugs List', 14, 20);
  
    // Convert data to table format
    const tableData = this.dataSource.map(drug => [
      drug.Way_Of_Giving || '',
      drug.Drugs_Text || '',
      drug.TimingString || '',
    ]);
  
    // Add table to PDF
    autoTable(doc, {
      head: [['Way of Giving', 'Drug Name', 'Timing']],
      body: tableData,
      startY: 30,
      styles: {
        fontSize: 10,
        cellPadding: 5, // Add padding for better spacing
        overflow: 'linebreak', // Wrap text to fit columns
        valign: 'middle', // Center text vertically
      },
      headStyles: {
        fillColor: [46, 125, 50], // Green header
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'right' }, // Right-align "Way of Giving"
        1: { cellWidth: 130, halign: 'left' }, // Left-align "Drug Name"
        2: { cellWidth: 40, halign: 'center' }, // Center-align "Timing"
      },
      margin: { top: 30, bottom: 20, left: 10, right: 10 }, // Adjust margins
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.text(`Page ${doc.getNumberOfPages()}`, data.settings.margin.left, pageHeight - 10);
      },
    });
  
    // Save PDF
    doc.save('ActiveDrugsList.pdf');
  }
  
  
  
 
}
