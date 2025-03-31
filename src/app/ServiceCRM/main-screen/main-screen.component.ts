import { Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserCRMComponent } from '../user-crm/user-crm.component';


@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss']
})
export class MainScreenComponent {
  // routes: Routes= [
  //   { path: 'UserCRMComponent', component: UserCRMComponent },

  // ];



  navigate(link: string): void {
    window.location.href = link;
  }
}
