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
  PingResults: { [key: number]: any } = {};
  searchControl = new FormControl('');
  private pingInterval: Subscription | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadServers();
    this.pingInterval = interval(600000).subscribe(() => this.autoPingServers());
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
      console.log('Servers loaded:', servers); // Log servers
      this.servers = servers;
      this.filteredServers = servers;
      this.autoPingServers();
      this.categorizeServers();
    }, error => {
      console.error('Error loading servers:', error);
    });
  }

  categorizeServers(): void {
    this.serverTypeServers = this.filteredServers.filter(server => server.Type === 'Server');
    this.otherTypeServers = this.filteredServers.filter(server => server.Type !== 'Server');
  }

  filterServers(searchText: string): void {
    this.filteredServers = this.servers.filter(server => 
      server.Hostname.toLowerCase().includes(searchText.toLowerCase()) ||
      server.Description.toLowerCase().includes(searchText.toLowerCase())
    );
    this.categorizeServers();
  }

  sendPingNow(): void {
    this.autoPingServers();
  }

  pingServer(ServerId: number): void {
    this.http.post<any>(`${environment.apiUrl}ServerPingCheckAPI/PingServer?serverId=${ServerId}`, {}).subscribe(response => {
      console.log('Ping response for server:', ServerId, response); // Log response
      this.PingResults[ServerId] = {
        ...response,
        LastCheck: new Date()
      };
    }, error => {
      console.error('Error pinging server:', error);
    });
  }

  autoPingServers(): void {
    this.servers.forEach(server => this.pingServer(server.ServerId));
  }

  getStatusColor(Status: string): string {
    return Status === 'Online' ? 'lightgreen' : 'lightcoral';
  }
}
