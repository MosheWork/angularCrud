import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../environments/environment'
@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  constructor(private _http: HttpClient) {}

  addEmployee(data: any): Observable<any> {
    return this._http.post('http://localhost:3000/employees', data);
  }

  getEmployeeList(): Observable<any> {
    return this._http.get(environment.apiUrl + 'ChameleonAPI');
  }
  getUnitsList(): Observable<any> {
    return this._http.get(environment.apiUrl + 'UnitsAPI');
  }
  getHosList(): Observable<any> {
    return this._http.get(environment.apiUrl + 'HostAPI');
  }
  getRportsEmployessPerSector(): Observable<any> {
    return this._http.get(environment.apiUrl + 'reportsAPI');
  }
  getTotalEmployee(): Observable<any> {
    return this._http.get(environment.apiUrl + 'HostAPI');
  }
  getConsiliums(): Observable<any> {
    return this._http.get(environment.apiUrl + 'ConsiliumsAPI');
  }
  deleteEmplyee(id: number): Observable<any> {
    return this._http.delete(`http://localhost:3000/employees/${id}`);
  }
  updateEmployee(id: number, data: any): Observable<any> {
    return this._http.put(`http://localhost:3000/employees/${id}`, data);
  }

  async getAllTableData(
    tableDataSource: MatTableDataSource<any>
  ): Promise<any[][]> {
    const data: any[][] = [];

    for (const row of tableDataSource.data) {
      const rowData: any[] = [];

      for (const key in row) {
        rowData.push(row[key]);
      }

      data.push(rowData);
      //debugger;
    }

    return data;
  }
}
