import { Component, OnInit, ViewChild } from '@angular/core';
import { TelemetryService } from './services/core/telemetry.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private telemetry: TelemetryService) {}
  ngOnInit() {
    this.telemetry.init();   // להתחיל להאזין לניווטים
  }
}
