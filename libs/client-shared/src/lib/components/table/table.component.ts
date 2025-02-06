import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatChipSet } from '@angular/material/chips';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Role, User, Workgroup, WorkgroupId } from '@asset-sg/shared/v2';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { ChipComponent } from '../chip';

export interface ColumnDefinition {
  name: string;
  header: string;
  key: keyof User;
  type: 'string' | 'checkbox' | 'workgroups' | 'action';
  sortable: boolean;
  hasTooltip?: boolean;
  icon?: string;
}

@Component({
  selector: 'asset-sg-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  standalone: true,
  imports: [
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCell,
    MatSortHeader,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatPaginator,
    TranslateModule,
    RouterLink,
    ChipComponent,
    MatChipSet,
    MatCheckbox,
    SvgIconComponent,
    MatTooltip,
  ],
})
export class TableComponent<T> implements OnInit, AfterViewInit {
  @Input() currentValue?: string;
  @Input() public COLUMNS: ColumnDefinition[] = [];
  @Input() public dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();
  @Input() public workgroups = new Map<WorkgroupId, Workgroup>();
  @Output() public updateCheckboxEvent = new EventEmitter<{ id: string; event: MatCheckboxChange }>();

  @ViewChild(MatPaginator) protected paginator!: MatPaginator;

  protected readonly WORKGROUP_DISPLAY_COUNT = 3;
  public cols: string[] = [];

  public ngOnInit() {
    this.cols = this.COLUMNS.map((col) => col.name);
  }

  public ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  public sortChange(sort: Sort) {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'firstName':
          return this.compare(a.firstName, b.firstName, isAsc);
        case 'lastName':
          return this.compare(a.lastName, b.lastName, isAsc);
        case 'email':
          return this.compare(a.email, b.email, isAsc);
        case 'lang':
          return this.compare(a.lang, b.lang, isAsc);
        default:
          return 0;
      }
    });
  }

  private compare(a: string, b: string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  public updateCheckboxValue(id: string, event: MatCheckboxChange) {
    this.updateCheckboxEvent.emit({ id, event });
  }

  public *getUserWorkgroups(user: User): Iterable<Workgroup & { role: Role }> {
    const iter = user.roles.entries();
    for (let i = 0; i < this.WORKGROUP_DISPLAY_COUNT; i++) {
      const { value, done } = iter.next();
      if (done) {
        break;
      }
      const [workgroupId, role] = value;
      const workgroup = this.workgroups.get(workgroupId);
      if (workgroup == null) {
        continue;
      }
      yield { ...workgroup, role };
    }
  }

  public formatWorkgroupsTooltip(roles: User['roles']): string {
    let tooltip = '';
    for (const [workgroupId] of roles) {
      const workgroup = this.workgroups.get(workgroupId);
      if (workgroup == null) {
        continue;
      }
      if (tooltip.length !== 0) {
        tooltip += ',\n';
      }
      tooltip += `${workgroup.name}`;
    }
    return tooltip;
  }
}
