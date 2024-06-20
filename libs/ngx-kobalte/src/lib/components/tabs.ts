import { Tabs } from '@kobalte/core';
import type { TabsContentOptions, TabsRootOptions, TabsTriggerOptions } from '@kobalte/core/dist/types/tabs';
import { Observable } from 'rxjs';
import { Accessor } from 'solid-js';
import h from 'solid-js/h';
import { render } from 'solid-js/web';

import { fromWithStartWith } from '../utils';

export type KobalteTabsProps = TabsRootOptions;

export interface KobalteTabsTriggerOptions extends Omit<TabsTriggerOptions, 'value'> {
  children: Accessor<string>;
}

export type KobalteTabsContentOptions = Omit<TabsContentOptions, 'value'>;

export interface KobalteTabProps {
  value: string;
  triggerProps: KobalteTabsTriggerOptions;
  contentProps: KobalteTabsContentOptions;
}

export function KobalteTabs(element: HTMLElement, props: KobalteTabsProps, tabs$: Observable<KobalteTabProps[]>) {
  const tabs = fromWithStartWith(tabs$, []);

  render(
    () =>
      h(Tabs.Root, props, () => [
        h(
          Tabs.List,
          {},
          tabs().map((tabProps) => h(Tabs.Trigger, { value: tabProps.value, ...tabProps.triggerProps }))
        ),
        () => h(tabs().map((tabProps) => h(Tabs.Content, { value: tabProps.value, ...tabProps.contentProps }))),
      ])(),
    element
  );
}
