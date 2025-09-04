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
  private readonly scripts: HTMLScriptElement[] = [];

  ngOnInit(): void {
    const gtmScript = this.renderer.createElement('script');
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.id}`;
    this.renderer.appendChild(document.head, gtmScript);

    const gtagScript = this.renderer.createElement('script');
    gtagScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${this.id}'); 
    `;
    this.renderer.appendChild(document.head, gtagScript);

    this.scripts.push(gtmScript, gtagScript);
  }

  ngOnDestroy(): void {
    for (const script of this.scripts) {
      this.renderer.removeChild(document.head, script);
    }
    delete (window as AnalyticsWindow).dataLayer;
  }
}

interface AnalyticsWindow {
  dataLayer?: Array<[string, ...unknown[]]>;
}
