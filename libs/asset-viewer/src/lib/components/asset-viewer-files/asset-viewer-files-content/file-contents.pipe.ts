import { Pipe, PipeTransform } from '@angular/core';
import { PageCategory, PageClassification, SupportedPageLanguage } from '@asset-sg/shared/v2';

type GroupedPageClassifications = { [key in PageCategory]?: PageClassification[] };

@Pipe({
  name: 'fileContents',
  standalone: false,
})
export class FileContentsPipe implements PipeTransform {
  transform(pageClassifications: PageClassification[]) {
    const languages = new Set<SupportedPageLanguage>();
    const categories = new Set<PageCategory>();
    const groupedPageClassifications: GroupedPageClassifications = {};
    pageClassifications.forEach((pc) => {
      pc.categories.forEach((category) => {
        if (!groupedPageClassifications[category]) {
          groupedPageClassifications[category] = [];
        }
        groupedPageClassifications[category].push(pc);

        pc.languages.forEach((language) => {
          languages.add(language);
        });
        pc.categories.forEach((category) => {
          categories.add(category);
        });
      });
    });

    return {
      groupedPageClassifications,
      languages: Array.from(languages).sort((a, b) => a.localeCompare(b)),
      categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
    };
  }
}
