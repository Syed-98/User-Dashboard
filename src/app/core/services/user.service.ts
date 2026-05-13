import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';
import { NewUserInput, User, UserRole } from '../models/user.model';

export interface RoleDistribution {
  readonly labels: readonly string[];
  readonly counts: readonly number[];
}

export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly pageCount: number;
}

const DEFAULT_PAGE_SIZE = 5;

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly usersSubject = new BehaviorSubject<readonly User[]>([
    {
      id: crypto.randomUUID(),
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      role: UserRole.Admin,
    },
    {
      id: crypto.randomUUID(),
      name: 'Riley Chen',
      email: 'riley.chen@example.com',
      role: UserRole.Editor,
    },
    {
      id: crypto.randomUUID(),
      name: 'Jamie Lee',
      email: 'jamie.lee@example.com',
      role: UserRole.Viewer,
    },
  ]);

  private readonly filterSubject = new BehaviorSubject<string>('');
  private readonly pageIndexSubject = new BehaviorSubject<number>(0);
  private readonly pageSizeSubject = new BehaviorSubject<number>(DEFAULT_PAGE_SIZE);

  readonly users$: Observable<readonly User[]> = this.usersSubject.asObservable();

  readonly filter$: Observable<string> = this.filterSubject.asObservable();

  readonly pageIndex$: Observable<number> = this.pageIndexSubject.asObservable();

  readonly pageSize$: Observable<number> = this.pageSizeSubject.asObservable();

  readonly filteredUsers$: Observable<readonly User[]> = combineLatest([
    this.users$,
    this.filter$.pipe(
      map((f) => f.trim().toLowerCase()),
      distinctUntilChanged(),
    ),
  ]).pipe(
    map(([users, needle]) => {
      if (!needle) {
        return users;
      }
      return users.filter(
        (u) =>
          u.name.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle) ||
          u.role.toLowerCase().includes(needle),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly pagedUsers$: Observable<PagedResult<User>> = combineLatest([
    this.filteredUsers$,
    this.pageIndex$,
    this.pageSize$,
  ]).pipe(
    map(([users, pageIndex, pageSize]) => {
      const total = users.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      const safePageIndex = Math.min(pageIndex, Math.max(0, pageCount - 1));
      const start = safePageIndex * pageSize;
      const items = users.slice(start, start + pageSize);
      return { items, total, pageIndex: safePageIndex, pageSize, pageCount };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly roleDistribution$: Observable<RoleDistribution> = this.users$.pipe(
    map((users) => this.buildRoleDistribution(users)),
    distinctUntilChanged(
      (a, b) =>
        a.counts[0] === b.counts[0] &&
        a.counts[1] === b.counts[1] &&
        a.counts[2] === b.counts[2],
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getUsersSnapshot(): readonly User[] {
    return this.usersSubject.value;
  }

  setFilter(value: string): void {
    this.filterSubject.next(value);
    this.pageIndexSubject.next(0);
  }

  setPageIndex(index: number): void {
    this.pageIndexSubject.next(Math.max(0, index));
  }

  setPageSize(size: number): void {
    const next = Math.max(1, Math.min(50, size));
    this.pageSizeSubject.next(next);
    this.pageIndexSubject.next(0);
  }

  emailExists(email: string, ignoreId?: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.usersSubject.value.some(
      (u) => u.email.toLowerCase() === normalized && u.id !== ignoreId,
    );
  }

  addUser(input: NewUserInput): User {
    const user: User = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role,
    };
    this.usersSubject.next([...this.usersSubject.value, user]);
    return user;
  }

  private buildRoleDistribution(users: readonly User[]): RoleDistribution {
    const labels = [UserRole.Admin, UserRole.Editor, UserRole.Viewer] as const;
    const counts = labels.map((role) => users.filter((u) => u.role === role).length);
    return { labels, counts };
  }
}
