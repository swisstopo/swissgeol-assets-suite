import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'replaceBr',
})
export class ReplaceBrPipe implements PipeTransform {
    transform(value: string | null) {
        return (value || '').replace(/<br>/g, '\n');
    }
}
