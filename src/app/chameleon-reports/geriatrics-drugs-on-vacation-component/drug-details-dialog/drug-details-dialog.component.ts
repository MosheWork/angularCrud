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
    const tableData = this.dataSource.map((drug) => [
      drug.Way_Of_Giving || '',
      drug.Drugs_Text || '',
      drug.TimingString || '',
    ]);
  
    // Add table to PDF
    autoTable(doc, {
      head: [['Way of Giving', 'Drug Name', 'Timing']],
      body: tableData,
      startY: 30, // Start 30 units from the top
      styles: {
        fontSize: 10,
        cellPadding: 5, // Add padding for better spacing
        overflow: 'linebreak', // Ensure text wraps to fit the cell
        valign: 'middle', // Vertically center the text
        halign: 'left', // Default horizontal alignment
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Fixed width for "Way of Giving"
        1: { cellWidth: 80 }, // Wider width for "Drug Name"
        2: { cellWidth: 40 }, // Fixed width for "Timing"
      },
      headStyles: {
        fillColor: [46, 125, 50], // Green header background
        textColor: [255, 255, 255], // White header text
        fontStyle: 'bold',
      },
      margin: { top: 30, left: 10, right: 10 }, // Adjust margins for better layout
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.text(
          `Page ${doc.getNumberOfPages()}`, // Footer text
          data.settings.margin.left,
          pageHeight - 10 // Position 10 units from the bottom
        );
      },
    });
  
    // Save PDF
    doc.save('ActiveDrugsList.pdf');
  }
}
