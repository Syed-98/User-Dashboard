import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UserFormComponent } from './user-form.component';

/**
 * Feature NgModule for the add-user dialog. Loaded on demand via dynamic `import()`
 * from {@link UserDashboardComponent} to keep the initial bundle lean.
 */
@NgModule({
  declarations: [UserFormComponent],
  imports: [CommonModule, ReactiveFormsModule],
  exports: [UserFormComponent],
})
export class UserFormModule {}

export { UserFormComponent } from './user-form.component';
