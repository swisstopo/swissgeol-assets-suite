import { isNotNil, unknownToUnknownError } from '@asset-sg/core';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Body,
  Controller,
  ExecutionContext,
  Injectable,
  Logger,
  Param,
  Post,
  createParamDecorator,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { AxiosRequestConfig } from 'axios';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as D from 'io-ts/Decoder';
import { catchError, firstValueFrom, map, of } from 'rxjs';

import { PrismaService } from '@/core/prisma.service';
import { getFile } from '@/utils/file/get-file';
import { putFile } from '@/utils/file/put-file';

const BufferBody = createParamDecorator(async (_, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest<import('express').Request>();
  if (!req.readable) {
    throw new BadRequestException('Invalid body');
  }

  const body = await streamToBufferAsync(req);
  return body;
});

const Config = D.struct({
  ocrUrl: D.string,
  ocrCallbackUrl: D.string,
});
type Config = D.TypeOf<typeof Config>;

@Injectable()
@Controller('ocr')
export class OcrController {
  private config: Config;

  constructor(private prismaService: PrismaService, private httpService: HttpService) {
    this.config = pipe(
      Config.decode({
        ocrUrl: process.env.OCR_URL,
        ocrCallbackUrl: process.env.OCR_CALLBACK_URL,
      }),
      E.getOrElseW((e) => {
        console.error(D.draw(e));
        process.exit(1);
      })
    );
  }

  @Post('ocr-success/:fileId/:filename')
  async ocrSuccess(@BufferBody() body: Buffer, @Param('fileId') fileId: string, @Param('filename') filename: string) {
    if (!body) {
      Logger.warn('ocrSuccess ------------> Empty Body');
      return;
    }
    Logger.log('OcrService ------------> success, saving pdf, size: ' + body.length);
    await pipe(
      putFile(filename, body, 'application/pdf'),
      TE.chain(() =>
        TE.tryCatch(
          () =>
            this.prismaService.file.update({
              where: { fileId: Number(fileId) },
              data: { ocrStatus: 'success', fileSize: body.length, lastModified: new Date() },
            }),
          unknownToUnknownError
        )
      )
    )();
    Logger.log(`SUCCESS OCR pdf ${filename} with id ${fileId}`);
  }

  @Post('ocr-error/:fileId/:filename')
  async ocrError(
    @Body() body: { error: string },
    @Param('fileId') fileId: string,
    @Param('filename') filename: string
  ) {
    Logger.log('OcrService ------------> error', `${body.error}`);
    await TE.tryCatch(
      () =>
        this.prismaService.file.update({
          where: { fileId: Number(fileId) },
          data: { ocrStatus: 'error', lastModified: new Date() },
        }),
      unknownToUnknownError
    )();
    Logger.warn('OCR Job Error for file: ' + filename);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    Logger.log('cron job running');
    const result = await pipe(
      TE.tryCatch(
        () =>
          this.prismaService.file.findFirst({
            where: { ocrStatus: 'waiting' },
          }),
        unknownToUnknownError
      ),
      TE.filterOrElseW(isNotNil, () => ({ _tag: 'nothingToDo' as const })),
      TE.bindTo('file'),
      TE.bindW('s3File', ({ file }) => getFile(this.prismaService, file.fileId)),
      TE.bindW('buffer', ({ s3File }) => streamToBufferTE(s3File.stream)),
      TE.bindW('updateResult', ({ file }) =>
        TE.tryCatch(
          () =>
            this.prismaService.file.update({
              where: { fileId: file.fileId },
              data: { ocrStatus: 'processing', lastModified: new Date() },
            }),
          unknownToUnknownError
        )
      ),
      TE.chainW(({ buffer, file }) => this.extractText(buffer, file.fileId, file.fileName))
    )();
    Logger.log('result', result);
  }

  extractText(pdfData: Buffer, fileId: number, filename: string) {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `${this.config.ocrUrl}/ocr`,
      headers: {
        'Content-Length': pdfData.length,
        'Content-Type': 'application/octet-stream',
        'x-filename': filename,
        'x-callback-success': `${this.config.ocrCallbackUrl}/ocr/ocr-success/${fileId}/${filename}`,
        'x-callback-error': `${this.config.ocrCallbackUrl}/ocr/ocr-error/${fileId}/${filename}`,
      },
      data: pdfData,
      timeout: 1000 * 60 * 15, // 15 minutes
      maxContentLength: 9000000000,
      maxBodyLength: 90000000000,
    };

    return TE.tryCatch(
      () =>
        firstValueFrom(
          this.httpService.request(config).pipe(
            map(() => true),
            catchError((e) => {
              if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET' || e.response?.status === 503)
                Logger.log('server busy');
              else {
                Logger.warn(`server problem: ${e}`);
              }
              return of(false);
            })
          )
        ),
      unknownToUnknownError
    );
  }
}

const streamToBufferAsync = (readableStream: NodeJS.ReadableStream) =>
  new Promise<Buffer>((resolve, reject) => {
    const bufs: Array<Uint8Array> = [];
    readableStream.on('data', (d) => {
      bufs.push(d);
    });
    readableStream.on('end', () => {
      const result = Buffer.concat(bufs);
      resolve(result);
    });
    readableStream.on('error', reject);
  });

const streamToBufferTE = (readableStream: NodeJS.ReadableStream) =>
  TE.tryCatch(() => streamToBufferAsync(readableStream), unknownToUnknownError);
