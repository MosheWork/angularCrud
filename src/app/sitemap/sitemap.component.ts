import { Component, OnInit } from '@angular/core';
import { Router, Route } from '@angular/router';

@Component({
  selector: 'app-sitemap',
  template: `
    <div style="padding:16px;font-family:Arial">
      <h2>Routes ready for screenshots ({{routes.length}})</h2>
      <ul><li *ngFor="let r of routes">{{ r }}</li></ul>
      <small>Exposed on <code>window.ROUTE_SITEMAP</code></small>
    </div>
  `
})
export class SitemapComponent implements OnInit {
  routes: string[] = [];
  constructor(private router: Router) {}

  ngOnInit(): void {
    const raw = this.flatten(this.router.config);
    const unique = Array.from(new Set(raw))
      .map(p => p.startsWith('/') ? p : '/' + p)
      .sort((a,b)=>a.localeCompare(b));
    this.routes = unique;
    (window as any).ROUTE_SITEMAP = this.routes; // <-- the C# runner reads this
  }

  private flatten(routes: Route[], base: string = ''): string[] {
    const out: string[] = [];
    for (const r of routes) {
      if (r.redirectTo || r.path === '**') continue;
      const full = this.join(base, r.path ?? '');
      const expanded = this.expandParams(full);
      if (!r.children || r.children.length === 0) out.push(...expanded);
      else for (const e of expanded) out.push(...this.flatten(r.children, e));
    }
    return out;
  }

  private join(a: string, b: string): string {
    const left = a.replace(/\/+$/,'');
    const right = b.replace(/^\/+/,'');
    return [left, right].filter(Boolean).join('/') || '/';
  }

  // Add samples for your common param names so dynamic routes are reachable
  private expandParams(path: string): string[] {
    if (!path.includes(':')) return [path || '/'];
    const samplesByName: Record<string,string[]> = {
      id: ['1','42','1001'],
      caseNumber: ['A123','B456'],
      userId: ['u1','u2'],
      Admission_No: ['1234567','7654321'],
      UnitName: ['Internal','Surgery'] // add more for your app
    };

    const segs = path.split('/');
    let acc: string[] = [''];
    for (const seg of segs) {
      if (!seg) { acc = acc.map(s => s + '/'); continue; }
      if (seg.startsWith(':')) {
        const name = seg.slice(1);
        const samples = samplesByName[name] ?? ['test'];
        const next: string[] = [];
        for (const p of acc) for (const v of samples) next.push(p.replace(/\/$/,'') + '/' + v);
        acc = next;
      } else {
        acc = acc.map(p => p.replace(/\/$/,'') + '/' + seg);
      }
    }
    return acc.map(s => s || '/');
  }
}
