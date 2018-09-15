import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http'
import { MatSnackBar } from '@angular/material'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { UserService } from './user.service'

export class AuthenticationInterceptor implements HttpInterceptor {
  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(
        (event: HttpEvent<any>) => {},
        (err: any) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
              this.userService.logout()
              const snackbarRef = this.snackBar.open(
                'Your session has expired. Please reconnect',
                'Reconnect',
                {
                  duration: 10000,
                }
              )
              snackbarRef.onAction().subscribe((action) => {
                this.userService.login()
              })
            }
          }
        }
      )
    )
  }
}
