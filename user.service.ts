import { Injectable } from '@angular/core';
import { GoogleLoginProvider, SocialAuthService, SocialUser } from 'angularx-social-login';
import { Subject } from 'rxjs';
import { CookieService } from 'ngx-cookie';
import { Router } from '@angular/router';
import User from '../interfaces/user';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: User | undefined;

  dataChange: Subject<User> = new Subject<User>();

  constructor(
    private authService: SocialAuthService,
    private httpService: HttpService,
    private cookieService: CookieService,
    private router: Router,
  ) {
    this.user = this.getUserFromCookies();

    this.dataChange.subscribe((data: User | undefined) => {
      if (data) {
        this.setUserToCookies(data);
        this.router.navigate(['/profiles']);
      }
      this.user = data;
    });

    this.authService.authState.subscribe((user: SocialUser) => {
      const result = this.httpService.post<User>('users/sign_in', { id_token: user.idToken });
      result.subscribe((data) => {
        this.dataChange.next(data);
      });
    });
  }

  signInWithGoogle(): void {
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  signOut(): void {
    this.dataChange.next(undefined);

    this.cookieService.remove('full_name');
    this.cookieService.remove('avatar_url');
    this.cookieService.remove('email');
    this.cookieService.remove('token');
    this.cookieService.remove('expires_at');
    this.router.navigate(['/']);
  }

  private getUserFromCookies(): User | undefined {
    const token = this.cookieService.get('token');

    if (!token) return;

    return {
      token,
      full_name: this.cookieService.get('full_name'),
      avatar_url: this.cookieService.get('avatar_url'),
      email: this.cookieService.get('email'),
      expires_at: this.cookieService.get('expires_at'),
    };
  }

  private setUserToCookies(user: User): void {
    const { token, email, expires_at, full_name, avatar_url } = user;

    this.cookieService.put('full_name', full_name);
    this.cookieService.put('avatar_url', avatar_url);
    this.cookieService.put('email', email);
    this.cookieService.put('token', token);
    this.cookieService.put('expires_at', expires_at);
  }
}
