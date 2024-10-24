import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'newlineToBr',
})
export class NewlineToBrPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/\n/g, '<br>');
  }
}
