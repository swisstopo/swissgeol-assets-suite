import { Policy } from '@asset-sg/shared/v2';
import { Reflector } from '@nestjs/core';

import { Class } from 'type-fest';

export const UsePolicy = Reflector.createDecorator<Class<Policy<unknown>>>();
