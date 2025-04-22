import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChildren,
  inject,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TabComponent } from '../tab/tab.component';

@Component({
  selector: 'asset-sg-tabs',
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class TabsComponent implements OnInit, AfterContentInit, OnDestroy {
  @Input({ transform: coerceBooleanProperty })
  public shouldUseHash = false;

  @ContentChildren(TabComponent)
  tabs!: QueryList<TabComponent>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly subscription = new Subscription();

  ngOnInit(): void {
    if (this.shouldUseHash) {
      this.subscription.add(this.route.fragment.subscribe(this.changeSelectedTabByFragment.bind(this)));
    }
  }

  ngAfterContentInit(): void {
    let hasSelectedTab = false;
    for (const tab of this.tabs) {
      tab.setParent(this);
      hasSelectedTab ||= tab.isSelected;
    }
    if (hasSelectedTab) {
      return;
    }
    if (this.shouldUseHash) {
      this.changeSelectedTabByFragment(this.route.snapshot.fragment);
    } else {
      this.changeSelectedTabToDefault();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  selectTab(tab: TabComponent): void {
    if (this.shouldUseHash) {
      const fragment = this.tabs.get(0) === tab ? undefined : tab.panelId;
      this.router.navigate([], { fragment: fragment ?? undefined, replaceUrl: true }).then();
    } else {
      this.changeSelectedTab(tab);
    }
  }

  private changeSelectedTabToDefault(): void {
    const tab = this.tabs?.get(0);
    if (tab !== undefined) {
      this.changeSelectedTab(tab);
    }
  }

  private changeSelectedTabByFragment(fragment: string | null): void {
    if (fragment === null || this.tabs == null) {
      this.changeSelectedTabToDefault();
      return;
    }
    const tab = this.tabs.find((tab) => tab.panelId === fragment);
    if (tab !== undefined) {
      this.changeSelectedTab(tab);
    }
  }

  private changeSelectedTab(tab: TabComponent) {
    for (const current of this.tabs) {
      if (current === tab) {
        current.select();
      } else {
        current.deselect();
      }
    }
  }
}
