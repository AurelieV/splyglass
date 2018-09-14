import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatProgressBarModule,
  MatSidenavModule,
  MatSnackBarModule,
  MatTableModule,
  MatToolbarModule,
} from '@angular/material'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterModule } from '@angular/router'
import { JwtModule } from '@auth0/angular-jwt'
import { environment } from './../environments/environment'
import { AppComponent } from './app.component'
import { AuthenticationInterceptor } from './authentication.interceptor'
import { CommingSoonComponent } from './comming-soon.component'
import { JWT_LOCALSTORAGE_KEY, MOBILE_MEDIA_QUERY } from './configuration'
import { FullComponent } from './full.component'
import { PlayerComponent } from './player.component'
import { PlayersService } from './players.service'
import { RefreshService } from './refresh.service'
import { SearchToolComponent } from './search-tool.component'
import { UserService } from './user.service'

const JWT_LOCALSTORAGE_KEY_VALUE = 'id_token'
export function tokenGetter() {
  return localStorage.getItem(JWT_LOCALSTORAGE_KEY_VALUE)
}

@NgModule({
  declarations: [
    AppComponent,
    SearchToolComponent,
    CommingSoonComponent,
    PlayerComponent,
    FullComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    FormsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter,
        whitelistedDomains: [environment.domain],
        blacklistedRoutes: [`${environment.domain}/api/auth/facebook`],
        headerName: 'x-auth-token',
        authScheme: '',
      },
    }),
    BrowserAnimationsModule,
    RouterModule.forRoot([
      { path: '', component: SearchToolComponent },
      { path: 'full', component: FullComponent },
      { path: 'stats', component: CommingSoonComponent },
      { path: 'my-page', component: CommingSoonComponent },
    ]),

    // Material
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  providers: [
    PlayersService,
    UserService,
    {
      provide: HTTP_INTERCEPTORS,
      multi: true,
      useFactory: (userService: UserService) =>
        new AuthenticationInterceptor(userService),
      deps: [UserService],
    },
    { provide: JWT_LOCALSTORAGE_KEY, useValue: JWT_LOCALSTORAGE_KEY_VALUE },
    { provide: MOBILE_MEDIA_QUERY, useValue: '(max-width: 720px)' },
    RefreshService,
  ],
  bootstrap: [AppComponent],
  entryComponents: [PlayerComponent],
})
export class AppModule {}
