import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    // Avoid double wrapping if already formatted or streaming
    return next.handle().pipe(
      map((data) => {
        // If data is null or undefined or already has success/data format or is a stream/buffer
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data as Response<T>;
        }
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
