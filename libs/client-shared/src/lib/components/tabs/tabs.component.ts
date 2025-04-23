import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, ContentChildren, QueryList } from '@angular/core';
import { TabComponent } from '../tab/tab.component';

@Component({
  selector: 'asset-sg-tabs',
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class TabsComponent implements AfterContentInit {
  @ContentChildren(TabComponent)
  tabs!: QueryList<TabComponent>;

  ngAfterContentInit(): void {
    let hasSelectedTab = false;
    for (const tab of this.tabs) {
      tab.setParent(this);
      hasSelectedTab ||= tab.isSelected;
    }
    if (!hasSelectedTab) {
      this.tabs.get(0)?.select();
    }
  }

  selectTab(tab: TabComponent): void {
    for (const current of this.tabs) {
      if (current === tab) {
        current.select();
      } else {
        current.deselect();
      }
    }
  }
}
