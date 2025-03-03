import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  pageTitle: string = 'ברוך הבא'; // Default title

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    // Listen to route changes and update the title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.data['title'] || 'ברוך הבא';
      })
    ).subscribe(title => {
      this.pageTitle = title;
    });
  }
}
