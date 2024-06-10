import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { environment } from '../../environments/environment';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-server-ping-check-app',
  templateUrl: './server-ping-check-app.component.html',
  styleUrls: ['./server-ping-check-app.component.scss']
})
export class ServerPingCheckAppComponent implements OnInit, OnDestroy {
  servers: any[] = [];
  filteredServers: any[] = [];
  serverTypeServers: any[] = [];
  otherTypeServers: any[] = [];
  pingResults: { [key: number]: any } = {};
  searchControl = new FormControl('');
  private pingInterval: Subscription | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadServers();
    this.pingInterval = interval(60000).subscribe(() => this.autoPingServers());
    this.searchControl.valueChanges.subscribe(searchText => {
      this.filterServers(searchText || '');
    });
  }

  ngOnDestroy(): void {
    if (this.pingInterval) {
      this.pingInterval.unsubscribe();
    }
  }

  loadServers(): void {
    this.http.get<any[]>(`${environment.apiUrl}ServerPingCheckAPI/GetServers`).subscribe(servers => {
      this.servers = servers;
      this.filteredServers = servers;
      this.autoPingServers();
      this.categorizeServers();
    }, error => {
      console.error('Error loading servers:', error);
    });
  }

  categorizeServers(): void {
    this.serverTypeServers = this.filteredServers.filter(server => server.type === 'Server');
    this.otherTypeServers = this.filteredServers.filter(server => server.type !== 'Server');
  }

  filterServers(searchText: string): void {
    this.filteredServers = this.servers.filter(server => 
      server.hostname.toLowerCase().includes(searchText.toLowerCase()) ||
      server.description.toLowerCase().includes(searchText.toLowerCase())
    );
    this.categorizeServers();
  }

  sendPingNow(): void {
    this.autoPingServers();
  }

  pingServer(serverId: number): void {
    this.http.post<any>(`${environment.apiUrl}ServerPingCheckAPI/PingServer?serverId=${serverId}`, {}).subscribe(response => {
      this.pingResults[serverId] = {
        ...response,
        lastCheck: new Date()
      };
    }, error => {
      console.error('Error pinging server:', error);
    });
  }

  autoPingServers(): void {
    this.servers.forEach(server => this.pingServer(server.serverId));
  }

  getStatusColor(status: string): string {
    return status === 'Online' ? 'lightgreen' : 'lightcoral';
  }
}
