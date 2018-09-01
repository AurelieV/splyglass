import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { JwtModule } from '@auth0/angular-jwt';
import { environment } from './../environments/environment';
import { AppComponent } from './app.component';
import { AuthenticationInterceptor } from './authentication.interceptor';
import { PlayersService } from './players.service';
import { UserService } from './user.service';

export function tokenGetter() {
  return localStorage.getItem('id_token');
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter,
        whitelistedDomains: [environment.domain],
        blacklistedRoutes: [`${environment.domain}/api/auth/facebook`],
        headerName: 'x-auth-token',
        authScheme: '',
      }
    }),
  ],
  providers: [
    PlayersService,
    UserService,
    {
      provide: HTTP_INTERCEPTORS,
      multi: true,
      useFactory: (userService: UserService) => new AuthenticationInterceptor(userService),
      deps: [UserService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
