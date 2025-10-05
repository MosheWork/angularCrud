import { Component, OnInit } from '@angular/core';
import { TelemetryService } from './services/core/telemetry.service';

import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private readonly APP_NAME = 'ONN-LINE'; // suffix, change if you want

  constructor(
    private telemetry: TelemetryService,
    private router: Router,
    private route: ActivatedRoute,
    private title: Title
  ) {}

  ngOnInit(): void {
    // keep your telemetry init
    this.telemetry.init();

    // set <title> based on the current route's data.title
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        map(() => {
          // walk to the deepest activated child
          let r = this.route;
          while (r.firstChild) r = r.firstChild;
          return r;
        }),
        mergeMap((r) => r.data) // { title: '...' } from your routes
      )
      .subscribe((data) => {
        const routeTitle = data?.['title'] as string | undefined;
        this.title.setTitle(routeTitle ? `${routeTitle} | ${this.APP_NAME}` : this.APP_NAME);
      });
  }
}
