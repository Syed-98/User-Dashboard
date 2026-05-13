import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  ViewChild,
  ViewContainerRef,
  createNgModule,
  inject,
  signal,
  ComponentRef,
  NgModuleRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import type { Chart, ChartConfiguration } from 'chart.js';
import { UserService, RoleDistribution } from '../../core/services/user.service';
import { ChartLoaderService } from '../../core/services/chart-loader.service';
import { NewUserInput } from '../../core/models/user.model';
import type { UserFormModule } from '../user-form/user-form.module';
import type { UserFormComponent } from '../user-form/user-form.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardComponent implements AfterViewInit {
  private readonly userService = inject(UserService);
  private readonly chartLoader = inject(ChartLoaderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pagedUsers$ = this.userService.pagedUsers$;
  readonly roleDistribution$ = this.userService.roleDistribution$;
  readonly filter$ = this.userService.filter$;
  readonly pageSize$ = this.userService.pageSize$;

  readonly chartLoading = signal(true);
  readonly formModuleLoading = signal(false);
  readonly modalOpen = signal(false);

  @ViewChild('modalHost', { read: ViewContainerRef })
  private readonly modalHost?: ViewContainerRef;

  @ViewChild('roleChart')
  private readonly chartCanvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private formModuleRef?: NgModuleRef<UserFormModule>;
  private formComponentRef?: ComponentRef<UserFormComponent>;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.teardownChart();
      this.closeModal();
    });
  }

  ngAfterViewInit(): void {
    this.bootstrapChart();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalOpen()) {
      this.closeModal();
    }
  }

  onFilterInput(value: string): void {
    this.userService.setFilter(value);
  }

  goToPreviousPage(): void {
    this.userService.pageIndex$.pipe(take(1)).subscribe((idx) => {
      this.userService.setPageIndex(idx - 1);
    });
  }

  goToNextPage(): void {
    this.userService.pageIndex$.pipe(take(1)).subscribe((idx) => {
      this.userService.setPageIndex(idx + 1);
    });
  }

  onPageSizeChange(raw: string): void {
    const size = Number(raw);
    if (!Number.isFinite(size)) {
      return;
    }
    this.userService.setPageSize(size);
  }

  async openAddUser(): Promise<void> {
    if (this.formModuleLoading() || this.modalOpen()) {
      return;
    }
    this.formModuleLoading.set(true);
    try {
      const { UserFormModule: LoadedUserFormModule, UserFormComponent: LoadedUserFormComponent } =
        await import('../user-form/user-form.module');

      this.closeModal();

      const moduleRef = createNgModule(LoadedUserFormModule, this.envInjector);
      this.formModuleRef = moduleRef;

      this.modalOpen.set(true);
      this.cdr.detectChanges();

      const host = this.modalHost;
      if (!host) {
        moduleRef.destroy();
        this.formModuleRef = undefined;
        this.modalOpen.set(false);
        return;
      }

      const componentRef = host.createComponent(LoadedUserFormComponent, {
        injector: moduleRef.injector,
      });
      this.formComponentRef = componentRef;

      componentRef.instance.submitted.pipe(take(1)).subscribe((payload: NewUserInput) => {
        this.userService.addUser(payload);
        this.closeModal();
      });

      componentRef.instance.cancelled.pipe(take(1)).subscribe(() => this.closeModal());
    } finally {
      this.formModuleLoading.set(false);
    }
  }

  closeModal(): void {
    this.modalHost?.clear();
    this.formComponentRef?.destroy();
    this.formModuleRef?.destroy();
    this.formComponentRef = undefined;
    this.formModuleRef = undefined;
    this.modalOpen.set(false);
    this.cdr.markForCheck();
  }

  trackByUserId(_: number, user: { id: string }): string {
    return user.id;
  }

  private bootstrapChart(): void {
    this.chartLoader
      .loadChart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (chartNs) => {
          const canvas = this.chartCanvas?.nativeElement;
          if (!canvas) {
            this.chartLoading.set(false);
            return;
          }

          const ChartCtor = chartNs.default;

          this.userService.roleDistribution$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((distribution) => {
              if (!this.chart) {
                this.chart = new ChartCtor(canvas, this.buildChartConfig(distribution)) as Chart;
              } else {
                this.applyDistribution(distribution);
              }
              this.chartLoading.set(false);
              this.cdr.markForCheck();
            });
        },
        error: () => {
          this.chartLoading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  private buildChartConfig(distribution: RoleDistribution): ChartConfiguration<'pie'> {
    return {
      type: 'pie',
      data: {
        labels: [...distribution.labels],
        datasets: [
          {
            data: [...distribution.counts],
            backgroundColor: ['#1c4980', '#2f6fb8', '#8eb7e8'],
            borderColor: '#383838',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#f0f0f0',
              boxWidth: 14,
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: '#2a2a2a',
            borderColor: '#1c4980',
            borderWidth: 1,
            titleColor: '#ffffff',
            bodyColor: '#e6e6e6',
          },
        },
      },
    };
  }

  private applyDistribution(distribution: RoleDistribution): void {
    if (!this.chart) {
      return;
    }
    this.chart.data.labels = [...distribution.labels];
    const dataset = this.chart.data.datasets[0];
    if (dataset && 'data' in dataset) {
      dataset.data = [...distribution.counts];
    }
    this.chart.update('none');
  }

  private teardownChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }
}
