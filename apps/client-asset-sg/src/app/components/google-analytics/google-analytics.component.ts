import { Component, inject, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-google-analytics',
  template: '',
  styles: `
    :host {
      display: none;
    }
  `,
  standalone: false,
})
export class GoogleAnalyticsComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  id!: string;

  private readonly renderer = inject(Renderer2);
  private script!: HTMLScriptElement;

  ngOnInit(): void {
    this.script = this.renderer.createElement('script');
    this.script.async = true;
    this.script.src = `https://www.googletagmanager.com/gtag/js?id=${this.id}`;
    this.renderer.appendChild(document.head, this.script);

    this.script.onload = () => {
      const dataLayer = ((window as AnalyticsWindow).dataLayer ??= []);
      dataLayer.push(['js', new Date()]);
      dataLayer.push(['config', this.id]);
    };
  }

  ngOnDestroy(): void {
    this.renderer.removeChild(document.head, this.script);
    delete (window as AnalyticsWindow).dataLayer;
  }
}

interface AnalyticsWindow {
  dataLayer?: Array<[string, unknown]>;
}
