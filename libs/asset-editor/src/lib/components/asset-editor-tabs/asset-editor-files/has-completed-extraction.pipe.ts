import { Pipe, PipeTransform } from '@angular/core';
import { FileProcessingStage, FileProcessingState } from '@asset-sg/shared/v2';
import { AssetFormFile } from '../../asset-editor-page/asset-editor-page.component';
import { FileProcessingStateMap, isExistingAssetFile } from './asset-editor-files.component';

/**
 * Checks whether the given file has completed the extraction stage, if applicable.
 * @param file The asset form file to check.
 * @param fileProcessingStates The map of file processing states.
 * @param requireExtractionStage Whether to specifically check for the extraction stage. Defaults to false.
 * @returns True if the file has completed the extraction stage (or any stage if not required), false otherwise.
 */
@Pipe({
  name: 'hasCompletedExtraction',
  pure: true,
})
export class HasCompletedExtractionPipe implements PipeTransform {
  transform(
    file: AssetFormFile,
    fileProcessingStates: FileProcessingStateMap,
    requireExtractionStage = false,
  ): boolean {
    if (!isExistingAssetFile(file)) {
      return false;
    }

    const state = fileProcessingStates.get(file.id);
    if (!state) {
      return false;
    }

    const isCompleted =
      state.fileProcessingState === FileProcessingState.Success ||
      state.fileProcessingState === FileProcessingState.Error;

    if (requireExtractionStage) {
      return (
        state.fileProcessingStage != null && state.fileProcessingStage === FileProcessingStage.Extraction && isCompleted
      );
    } else {
      return state.fileProcessingStage != null && isCompleted;
    }
  }
}
