// telemetry.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment'; // adjust path if needed

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private lastUrl = '';
  constructor(private router: Router, private http: HttpClient) {}

  init() {
    this.router.events.pipe(
      // tell TS that after this filter, the event is NavigationEnd
      filter((e: RouterEvent): e is NavigationEnd => e instanceof NavigationEnd)
    )
    .subscribe(e => {
      const url = e.urlAfterRedirects || e.url;
      if (url === this.lastUrl) return;
      this.lastUrl = url;

      // HashLocationStrategy: strip "#/"
      const route = url.startsWith('#/') ? url.substring(2) : url.replace(/^#\//, '');
      this.http.post(environment.apiUrl + 'telemetry/route-hit', {
        route,
        tsUtc: new Date().toISOString()
      }).subscribe({ next: () => {}, error: () => {} });
    });
  }
}
