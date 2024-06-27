import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { User, Workgroup } from '../../services/admin.service';

@Component({
  selector: 'asset-sg-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
})
export class UserEditComponent implements OnInit {
  @Input() user?: User;
  @Input() workgroups: Workgroup[] = [];

  public formGroup = new FormGroup({
    isAdmin: new FormControl(false),
    lang: new FormControl('de'),
    asViewer: new FormControl<number[]>([]),
    asEditor: new FormControl<number[]>([]),
    asMasterEditor: new FormControl<number[]>([]),
  });

  public ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.formGroup.patchValue({
      isAdmin: this.user?.isAdmin ?? false,
      asViewer:
        this.user?.workgroups
          .filter((workgroup) => workgroup.role === 'Viewer')
          .map((workgroup) => workgroup.workgroupId) ?? [],
      asEditor:
        this.user?.workgroups
          .filter((workgroup) => workgroup.role === 'Editor')
          .map((workgroup) => workgroup.workgroupId) ?? [],
      asMasterEditor:
        this.user?.workgroups
          .filter((workgroup) => workgroup.role === 'MasterEditor')
          .map((workgroup) => workgroup.workgroupId) ?? [],
    });
  }
}
