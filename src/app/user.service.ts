import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import jwtDecode from 'jwt-decode';
import { BehaviorSubject } from 'rxjs';
import { environment } from './../environments/environment';

export interface User {
  id: string;
  displayName: string;
}

@Injectable()
export class UserService {
  user$ = new BehaviorSubject<User>(undefined);

  set user(value: User) {
    console.log("pouet");
    this.user$.next(value);
  }

  get user() {
    return this.user$.getValue();
  }

  constructor(private http: HttpClient ) {
    if (!window['fbAsyncInit']) {
      window['fbAsyncInit'] = function() {
        window['FB'].init({
          appId      : environment.facebookId,
          cookie     : true,
          xfbml      : true,
          version    : 'v3.1'
        });
        window['FB'].AppEvents.logPageView();
      };
    }
    // Load facebook script
    if (!document.getElementById('facebook-jssdk')) {
      const fjs = document.getElementsByTagName('script')[0];
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }
    this.updateUser();
  }

  login() {
    window['FB'].login(res => {
      this.http.post('/api/auth/facebook', {access_token: res.authResponse.accessToken}, {observe: 'response'})
      .subscribe((res: any) => {
        const token = res.headers.get('x-auth-token');
        if (token) {
          localStorage.setItem('id_token', token);
          this.user = jwtDecode(token);
        }
      })
    }, {scope: 'public_profile'})
  }

  logout() {
    localStorage.removeItem('id_token');
    this.user = null;
  }

  private updateUser() {
    const token = localStorage.getItem('id_token');
    if (!token) {
      this.user = null;
      return;
    }
    this.user = jwtDecode(token);
  }
}