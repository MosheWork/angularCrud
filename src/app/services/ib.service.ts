import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Subject, interval } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

export interface Quote {
  bid: number | null;
  ask: number | null;
  last: number | null;
}
export interface StartQuoteResponse { reqId: number; }

export interface PlaceOrderRequest {
  symbol: string;
  quantity: number;
  side: 'BUY' | 'SELL';
  exchange?: string;
  currency?: string;
}

/** 👉 NEW: table types */
export interface QuoteHandle { symbol: string; reqId: number; }
export interface QuoteRow { reqId: number; bid: number|null; ask: number|null; last: number|null; }

@Injectable({ providedIn: 'root' })
export class IbService {
  // Make sure this ends with '/api/', e.g. 'http://localhost:44310/api/'
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ===== Single symbol endpoints (you already had these) =====

  /** POST api/MarketData/PostQuote  (body: { symbol, exchange?, currency? }) */
  startQuote(symbol: string, exchange = 'SMART', currency = 'USD') {
    return this.http.post<StartQuoteResponse>(
      this.base + 'MarketData/PostQuote',
      { symbol, exchange, currency }
    );
  }

  /** GET api/MarketData/GetQuote/{reqId} */
  getQuote(reqId: number) {
    return this.http.get<Quote>(this.base + 'MarketData/GetQuote/' + reqId);
  }

  /** DELETE api/MarketData/DeleteQuote/{reqId} */
  cancelQuote(reqId: number) {
    return this.http.delete(this.base + 'MarketData/DeleteQuote/' + reqId);
  }

  /** POST api/Orders/PostOrder  (body: PlaceOrderRequest) */
  placeOrder(body: PlaceOrderRequest) {
    return this.http.post<{ orderId: number; status: string }>(
      this.base + 'Orders/PostOrder',
      body
    );
  }

  /**
   * Start a single quote and poll it.
   * Returns { reqId$, quote$, stop() }.
   */
  streamQuote(symbol: string, pollMs = 1500) {
    const stop$ = new Subject<void>();
    const reqId$ = new Subject<number>();
    const quote$ = new Subject<Quote>();

    this.startQuote(symbol).subscribe({
      next: (r) => {
        reqId$.next(r.reqId);
        interval(pollMs).pipe(
          switchMap(() => this.getQuote(r.reqId)),
          takeUntil(stop$)
        ).subscribe({
          next: q => quote$.next(q),
          error: err => console.error('quote poll error', err)
        });
      },
      error: err => console.error('startQuote error', err)
    });

    const stop = (reqId?: number) => {
      stop$.next(); stop$.complete();
      if (reqId != null) this.cancelQuote(reqId).subscribe({ error: () => {} });
    };

    return { reqId$, quote$, stop };
  }

  // ===== 👉 NEW: Multi-symbol (table) endpoints matching /api/ib/marketdata/quotes =====

  /** POST /api/ib/marketdata/quotes  { symbols: ["AAPL","MSFT"] } */
  startQuotes(symbols: string[]) {
    return this.http.post<{ items: QuoteHandle[] }>(
      this.base + 'ib/marketdata/quotes',
      { symbols }
    );
  }

  /** GET /api/ib/marketdata/quotes?reqIds=1,2,3 */
  getQuotes(reqIds: number[]) {
    const qs = encodeURIComponent(reqIds.join(','));
    return this.http.get<QuoteRow[]>(
      this.base + 'ib/marketdata/quotes?reqIds=' + qs
    );
  }

  /** DELETE /api/ib/marketdata/quotes?reqIds=1,2,3 */
  cancelQuotes(reqIds: number[]) {
    const qs = encodeURIComponent(reqIds.join(','));
    return this.http.delete(
      this.base + 'ib/marketdata/quotes?reqIds=' + qs
    );
  }

  /**
   * Stream many symbols as a table via polling.
   * Returns { handles$, rows$, stop() }.
   */
  streamQuotes(symbols: string[], pollMs = 1000) {
    const handles$ = new Subject<QuoteHandle[]>();
    const rows$ = new Subject<QuoteRow[]>();
    const stop$ = new Subject<void>();

    this.startQuotes(symbols).subscribe({
      next: r => {
        handles$.next(r.items);
        const ids = r.items.map(h => h.reqId);
        interval(pollMs).pipe(
          switchMap(() => this.getQuotes(ids)),
          takeUntil(stop$)
        ).subscribe({
          next: rows => rows$.next(rows),
          error: err => console.error('batch poll error', err)
        });
      },
      error: err => console.error('startQuotes error', err)
    });

    const stop = (reqIds?: number[]) => {
      stop$.next(); stop$.complete();
      if (reqIds?.length) this.cancelQuotes(reqIds).subscribe({ error: () => {} });
    };

    return { handles$, rows$, stop };
  }
}
