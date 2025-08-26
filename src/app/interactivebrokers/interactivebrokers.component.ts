import { Component, OnDestroy } from '@angular/core';
import { IbService, Quote, QuoteHandle, QuoteRow } from '../services/ib.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-interactivebrokers',
  templateUrl: './interactivebrokers.component.html',
  styleUrls: ['./interactivebrokers.component.scss']
})
export class InteractivebrokersComponent implements OnDestroy {
  // --- single symbol console ---
  form = this.fb.group({
    symbol: ['AAPL', [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    side: ['BUY', [Validators.required]]
  });
  reqId: number | null = null;
  quote: Quote | null = null;
  placing = false;
  message = '';
  private stopFn?: (reqId?: number) => void;
  private subs: Subscription[] = [];

  // --- multi-symbol table ---
  symbolsCtrl = new FormControl<string>('AAPL,MSFT,GOOG,AMZN,TSLA', { nonNullable: true });
  handles: QuoteHandle[] = [];
  rows: QuoteRow[] = [];
  private stopTableFn?: (reqIds?: number[]) => void;

  constructor(private fb: FormBuilder, private ib: IbService) {}

  // ===== Single symbol actions =====
  startQuote() {
    this.message = '';
    const symbol = this.form.value.symbol?.trim();
    if (!symbol) { this.message = 'Enter a symbol'; return; }

    // stop previous stream
    this.stopFn?.(this.reqId ?? undefined);
    this.reqId = null; this.quote = null;

    const stream = this.ib.streamQuote(symbol, 1500);
    this.subs.push(stream.reqId$.subscribe(id => this.reqId = id));
    this.subs.push(stream.quote$.subscribe(q => this.quote = q));
    this.stopFn = stream.stop;
  }

  stopQuote() {
    this.message = '';
    this.stopFn?.(this.reqId ?? undefined);
    this.stopFn = undefined;
  }

  placeOrder() {
    this.message = '';
    if (this.form.invalid) { this.message = 'Fix form errors'; return; }
    const { symbol, quantity, side } = this.form.value;
    if (!symbol || !quantity || !side) return;

    this.placing = true;
    this.ib.placeOrder({
      symbol,
      quantity,
      side: side as 'BUY' | 'SELL'
    }).subscribe({
      next: r => { this.message = `Order ${r.orderId} ${r.status}`; this.placing = false; },
      error: e => { this.message = `Order failed: ${e?.error || e?.message || e}`; this.placing = false; }
    });
  }

  // ===== Table actions =====
  startTable() {
    const raw = this.symbolsCtrl.value || '';
    const symbols = raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!symbols.length) { this.message = 'Enter at least one symbol'; return; }

    // stop previous table stream
    this.stopTable();

    const stream = this.ib.streamQuotes(symbols, 1000); // 1s polling
    stream.handles$.subscribe(h => this.handles = h);
    stream.rows$.subscribe(r => this.rows = r);
    this.stopTableFn = stream.stop;
  }

  stopTable() {
    if (this.stopTableFn && this.handles.length) {
      const ids = this.handles.map(h => h.reqId);
      this.stopTableFn(ids);
    }
    this.stopTableFn = undefined;
    this.rows = [];
    this.handles = [];
  }

  symbolFor(reqId: number) {
    return this.handles.find(h => h.reqId === reqId)?.symbol ?? '';
  }

  // optional: quick per-row order helpers
  buy(symbol: string)  { this.quickOrder(symbol, 1, 'BUY'); }
  sell(symbol: string) { this.quickOrder(symbol, 1, 'SELL'); }

  private quickOrder(symbol: string, qty: number, side: 'BUY'|'SELL') {
    this.ib.placeOrder({ symbol, quantity: qty, side }).subscribe({
      next: r => this.message = `Order ${side} ${symbol}: ${r.status} (#${r.orderId})`,
      error: e => this.message = `Order ${side} ${symbol} failed: ${e?.error || e?.message || e}`
    });
  }

  ngOnDestroy(): void {
    this.stopQuote();
    this.stopTable();
    this.subs.forEach(s => s.unsubscribe());
  }
}
