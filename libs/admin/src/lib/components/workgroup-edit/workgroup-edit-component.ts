import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AdminService, User, Workgroup } from '../../services/admin.service';

@Component({
  selector: 'asset-sg-workgroup-edit',
  templateUrl: './workgroup-edit.component.html',
  styleUrls: ['./workgroup-edit.component.scss'],
})
export class WorkgroupEditComponent implements OnInit {
  private _adminService = inject(AdminService);

  @Input() workgroup: Workgroup | null = null;
  @Input() users: User[] = [];
  @Input() mode: 'edit' | 'create' | undefined = undefined;

  public readonly formGroup: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    viewers: new FormControl(),
    editors: new FormControl(),
    masterEditors: new FormControl(),
    status: new FormControl(),
  });

  public ngOnInit() {
    this.initializeForm();
    console.log(this.workgroup);
  }

  public initializeForm() {
    this.formGroup.patchValue({
      name: this.workgroup?.name ?? '',
      viewers: this.workgroup?.users.filter((user) => user.role === 'Viewer').map((user) => user.userId) ?? [],
      editors: this.workgroup?.users.filter((user) => user.role === 'Editor').map((user) => user.userId) ?? [],
      masterEditors:
        this.workgroup?.users.filter((user) => user.role === 'MasterEditor').map((user) => user.userId) ?? [],
      status: !!this.workgroup?.disabled_at,
    });
  }

  public save() {
    if (!this.formGroup.valid) {
      return;
    }
    const workgroup: Omit<Workgroup, 'id'> = {
      name: this.formGroup.controls['name'].value,
      users: [
        ...this.formGroup.controls['viewers'].value.map((userId: number) => ({ userId, role: 'Viewer' })),
        ...this.formGroup.controls['editors'].value.map((userId: number) => ({ userId, role: 'Editor' })),
        ...this.formGroup.controls['masterEditors'].value.map((userId: number) => ({ userId, role: 'MasterEditor' })),
      ],
      assets: this.workgroup?.assets ?? [],
      disabled_at: this.formGroup.controls['status'].value ? new Date() : null,
    };

    if (this.mode === 'create') {
      this._adminService.createWorkgroup(workgroup).subscribe((res) => console.log(res));
    } else {
      this._adminService.updateWorkgroups(this.workgroup?.id ?? 0, workgroup).subscribe((res) => console.log(res));
    }
  }
}
