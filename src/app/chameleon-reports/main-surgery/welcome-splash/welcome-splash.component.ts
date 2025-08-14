import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ⬅️ Use your existing service (path same as your example)
import { AuthenticationService } from '../../../services/authentication-service/authentication-service.component';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-welcome-splash',
  templateUrl: './welcome-splash.component.html',
  styleUrls: ['./welcome-splash.component.scss']
})
export class WelcomeSplashComponent implements OnInit {
  /** Show time (ms). Default: 5000 */
  @Input() durationMs = 5000;
  /** Allow click to dismiss early */
  @Input() closable = true;

  /** UI text/images (defaults used until data loads) */
  @Input() titleText = 'מערכת יעל';
  @Input() subText = 'מכין את הדף עבורך…';
  @Input() backgroundImageUrl = 'assets/back1.jpg';
  //@Input() logoUrl = 'assets/logo.png';

  /** Event when splash is gone */
  @Output() done = new EventEmitter<void>();

  // populated from AuthenticationService + DB call
  userName = 'משתמש';
  profilePictureUrl = 'assets/default-user.png';

  visible = true;

  constructor(
    private auth: AuthenticationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // start the timer immediately so splash hides after duration regardless
    setTimeout(() => this.finish(), this.durationMs);

    // 1) Get OS user string (DOMAIN\username) from your auth service
    this.auth.getAuthentication().subscribe({
      next: (resp: any) => {
        const raw = (resp?.message || '').toString();
        const username = raw.includes('\\') ? raw.split('\\')[1] : raw;
        const uname = (username || '').toUpperCase();

        if (!uname) return;

        // 2) Fetch profile details from your API
        this.http
          .get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${uname}`)
          .subscribe({
            next: (data) => {
              if (data?.UserName) this.userName = data.UserName;
              if (data?.ProfilePicture) this.profilePictureUrl = `${data.ProfilePicture}`;
            },
            error: () => {
              // keep defaults if it fails
            }
          });
      },
      error: () => {
        // keep defaults if auth fails
      }
    });
  }

  finish() {
    const root = document.querySelector('.splash-container') as HTMLElement;
    if (root) root.style.transition = 'opacity .35s ease'; 
    if (root) root.style.opacity = '0';
    setTimeout(() => { this.visible = false; this.done.emit(); }, 350);
  }

  onOverlayClick(): void {
    if (this.closable) this.finish();
  }
}