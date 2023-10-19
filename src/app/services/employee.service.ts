import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';


@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  constructor(private _http: HttpClient) {}

  addEmployee(data: any): Observable<any> {
    return this._http.post('http://localhost:3000/employees', data);
  }

  getEmployeeList(): Observable<any> {
    return this._http.get('http://localhost:7144/api/ChameleonAPI');
  }
  getUnitsList(): Observable<any> {
    return this._http.get('http://localhost:7144/api/UnitsAPI');
  }
  getHosList(): Observable<any> {
    return this._http.get('http://localhost:7144/api/HostAPI');
  }
 

  deleteEmplyee(id: number): Observable<any> {
    return this._http.delete(`http://localhost:3000/employees/${id}`);
  }
  updateEmployee(id: number, data: any): Observable<any> {
    return this._http.put(`http://localhost:3000/employees/${id}`, data);
  }


  async getAllTableData(tableDataSource: MatTableDataSource<any>): Promise<any[][]> {
    const data: any[][] = [];

    for (const row of tableDataSource.data) {
      const rowData: any[] = [];

      for (const key in row) {
        rowData.push(row[key]);
      }

      data.push(rowData);
    }

    return data;
  }

}
