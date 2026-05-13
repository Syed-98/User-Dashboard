import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NewUserInput, USER_ROLES, UserRole } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent {
  @Output() readonly submitted = new EventEmitter<NewUserInput>();
  @Output() readonly cancelled = new EventEmitter<void>();

  readonly roles = USER_ROLES;

  readonly form: FormGroup = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as UserRole | '', [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
  ) {}

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { name, email, role } = this.form.getRawValue();
    if (this.userService.emailExists(email)) {
      this.form.controls['email'].setErrors({ duplicate: true });
      return;
    }
    this.submitted.emit({ name, email, role: role as UserRole });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
