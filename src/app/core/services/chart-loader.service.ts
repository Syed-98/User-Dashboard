import { Injectable } from '@angular/core';
import { Observable, defer } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

type ChartModule = typeof import('chart.js/auto');

@Injectable({ providedIn: 'root' })
export class ChartLoaderService {
  private chartModule$?: Observable<ChartModule>;

  /**
   * Lazily loads Chart.js exactly once per application lifetime.
   */
  loadChart(): Observable<ChartModule> {
    if (!this.chartModule$) {
      this.chartModule$ = defer(() => import('chart.js/auto')).pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.chartModule$;
  }
}
