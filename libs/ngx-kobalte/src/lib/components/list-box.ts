import { Listbox } from '@kobalte/core';
import type { ListboxItemOptions, ListboxRootOptions } from '@kobalte/core/dist/types/listbox';
import { Observable } from 'rxjs';
import h from 'solid-js/h';
import { render } from 'solid-js/web';

import { fromWithStartWith } from '../utils';

export interface KobalteListboxProps extends Omit<ListboxRootOptions, 'value'> {
  value$: Observable<Iterable<string>>;
}
export interface KobalteListboxItemProps extends ListboxItemOptions {
  children: string;
}

export function KobalteListbox(
  element: HTMLElement,
  props: KobalteListboxProps,
  children$: Observable<KobalteListboxItemProps[]>
) {
  const { value$, ...propsRest } = props;
  const value = fromWithStartWith(value$, []);
  const _props = { ...propsRest, value };
  const children = fromWithStartWith(children$, []);
  render(() => h(Listbox.Root, _props, () => children().map((childProps) => h(Listbox.Item, childProps)))(), element);
}
