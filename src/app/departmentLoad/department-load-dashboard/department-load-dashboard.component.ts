import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DepartmentDetailDialogComponent } from '../../departmentLoad/department-detail/department-detail.component';
import { EditDepartmentDialogComponent } from '../edit-department-dialog/edit-department-dialog.component';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';  // Import the plugin
import * as XLSX from 'xlsx';

Chart.register(...registerables, ChartDataLabels);  // Register the plugin

export interface DepartmentLoad {
  id: number;
  departName: string;
  patientCount: number;
  totalBeds: number;
  currentStaff: number;
  totalStaff: number;
  patientComplexity: number;
  totalLoad?: number;
}

@Component({
  selector: 'app-department-load-dashboard',
  templateUrl: './department-load-dashboard.component.html',
  styleUrls: ['./department-load-dashboard.component.scss']
})
export class DepartmentLoadDashboardComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['departName', 'patientCount', 'totalBeds', 'currentStaff', 'totalStaff', 'patientComplexity', 'totalLoad', 'actions'];
  dataSource = new MatTableDataSource<DepartmentLoad>();
  gaugeValue: number = 0;
  totalPatients: number = 0;
  isHandset$: Observable<boolean>;
  loginUserName = '';
  selectedDepartments: string[] = [];
  private filterChangeSubject = new Subject<string>();
  showTable: boolean = true;
  private chart?: Chart<'bar' | 'pie'>;
  chartType: 'bar' | 'pie' = 'bar';

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    private http: HttpClient,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map((result: any) => result.matches),
        shareReplay()
      );

    this.filterChangeSubject.asObservable().subscribe(() => {
      this.updateGaugeValue();
    });

    Chart.register(...registerables, ChartDataLabels);
  }

  ngOnInit(): void {
    this.fetchData();

    this.dataSource.filterPredicate = (data: DepartmentLoad, filter: string) => {
      const matchFilter = [];
      const filterArray = filter.split('$');

      const searchTerm = filterArray[0];
      const selectedDepartments = filterArray[1] ? filterArray[1].split(',') : [];

      // Apply search filter
      const customFilter = data.departName.toLowerCase().includes(searchTerm);

      // Apply department filter
      if (selectedDepartments.length > 0) {
        const departmentFilter = selectedDepartments.includes(data.departName);
        matchFilter.push(customFilter && departmentFilter);
      } else {
        matchFilter.push(customFilter);
      }

      return matchFilter.every(Boolean);
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  fetchData(): void {
    this.http.get<DepartmentLoad[]>(`${environment.apiUrl}ChamelleonCurrentPatientsAPI/GetPatientCount`)
      .subscribe((data: DepartmentLoad[]) => {
        const departments = data.map((department: DepartmentLoad) => ({
          ...department,
          totalLoad: this.calculateTotalLoad(department.patientCount, department.totalBeds)
        }));
        this.dataSource.data = departments;
        this.updateGaugeValue();
        this.createChart(departments);
      }, (error: any) => {
        console.error('Error fetching data', error);
      });
  }

  calculateTotalLoad(patientCount: number, totalBeds: number): number {
    return totalBeds > 0 ? (patientCount / totalBeds) * 100 : 0;
  }

  updateGaugeValue(): void {
    const filteredData = this.dataSource.filteredData;
    const totalCurrentPatients = filteredData.reduce((sum, department) => sum + department.patientCount, 0);
    const totalBeds = filteredData.reduce((sum, department) => sum + department.totalBeds, 0);
    this.totalPatients = totalCurrentPatients;
    this.gaugeValue = totalBeds > 0 ? (totalCurrentPatients / totalBeds) * 100 : 0;
  }

  getTotalLoadClass(totalLoad: number): string {
    if (totalLoad > 100) {
      return 'total-load-red';
    } else if (totalLoad >= 80) {
      return 'total-load-yellow';
    } else {
      return 'total-load-green';
    }
  }

  getGaugeColor(totalLoad: number): string {
    if (totalLoad > 100) {
      return '#f44336'; // red
    } else if (totalLoad >= 80) {
      return '#ff9800'; // orange
    } else {
      return '#4caf50'; // green
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.updateFilter(filterValue, this.selectedDepartments);
  }

  onDepartmentFilterChange(selectedDepartments: string[]): void {
    this.selectedDepartments = selectedDepartments;
    this.updateFilter(this.dataSource.filter.split('$')[0], selectedDepartments);
  }

  updateFilter(searchTerm: string, selectedDepartments: string[]): void {
    const filterValue = `${searchTerm}$${selectedDepartments.join(',')}`;
    this.dataSource.filter = filterValue;
    this.filterChangeSubject.next(filterValue);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters(): void {
    this.selectedDepartments = [];
    this.dataSource.filter = '';
    this.filterChangeSubject.next('');
    this.applyFilter({ target: { value: '' } } as any);
  }

  openMoreInfo(row: DepartmentLoad) {
    this.dialog.open(DepartmentDetailDialogComponent, {
      width: '400px',
      data: { id: row.id }
    });
  }

  openEditDialog(row: DepartmentLoad) {
    const dialogRef = this.dialog.open(EditDepartmentDialogComponent, {
      width: '400px',
      data: { ...row }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle the result here (e.g., update the table with the new data)
        const index = this.dataSource.data.findIndex(item => item.id === result.id);
        if (index !== -1) {
          this.dataSource.data[index] = result;
          this.dataSource.data = [...this.dataSource.data]; // Refresh the data source
        }
      }
    });
  }

  toggleView(): void {
    this.showTable = !this.showTable;
    if (!this.showTable) {
      setTimeout(() => {
        this.createChart(this.dataSource.data);
      });
    }
  }

  switchChartType(): void {
    this.chartType = this.chartType === 'bar' ? 'pie' : 'bar';
    this.createChart(this.dataSource.data);
  }

  createChart(departments: DepartmentLoad[]): void {
    if (this.chart) {
      this.chart.destroy();
    }
  
    const totalLoads = departments.map(department => department.totalLoad ?? 0);  // Ensure no undefined values
    const departmentNames = departments.map(department => department.departName);
    const backgroundColors = departmentNames.map(() => this.getRandomColor());
  
    const config: ChartConfiguration<'bar' | 'pie'> = {
      type: this.chartType,
      data: {
        labels: departmentNames,
        datasets: [
          {
            label: 'Total Load (%)',
            data: totalLoads,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.2', '1')),
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            color: '#000000', // Change label color to black for better contrast
            font: {
              size: 10, // Adjust font size
              weight: 'bold' // Adjust font weight
            },
            anchor: 'end',
            align: 'start',
            formatter: function(value, context) {
              const label = context.chart.data.labels && context.chart.data.labels[context.dataIndex]
                ? context.chart.data.labels[context.dataIndex]
                : '';
              return (label as string).length > 15 ? (label as string).substring(0, 15) + '...' : label; // Truncate long labels
            }
          }
        },
        scales: this.chartType === 'bar' ? {
          x: {
            ticks: {
              autoSkip: false, // Show all labels on the x-axis
              maxRotation: 45, // Rotate labels for better fit
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true
          }
        } : undefined
      }
    };
  
    this.chart = new Chart(this.chartCanvas.nativeElement.getContext('2d') as CanvasRenderingContext2D, config);
  }
  
  

  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  exportToExcel() {
    const dataToExport = this.dataSource.filteredData.map(item => ({
      'שם מחלקה': item.departName,
      'סה"כ מטופלים': item.patientCount,
      'סה"כ מיטות': item.totalBeds,
      'צוות נוכחי': item.currentStaff,
      'תקן צוות': item.totalStaff,
      'מורכבות המטופל': item.patientComplexity,
      'מדד עומס (%)': item.totalLoad ? item.totalLoad.toFixed(2) + '%' : 'N/A'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = { Sheets: { 'נתונים': worksheet }, SheetNames: ['נתונים'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    this.saveAsExcelFile(excelBuffer, 'filtered_data');
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(data);
    link.href = url;
    link.download = `${fileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(url); // Clean up URL.createObjectURL references
  }
}
