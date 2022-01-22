import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { share, catchError, finalize } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  server = environment.apiUrl;

  requestsInProgress: number = 0;

  requestsInProgressChange: Subject<number> = new Subject<number>();

  constructor(
    private httpClient: HttpClient,
    private cookieService: CookieService,
    private router: Router,
  ) {
    this.requestsInProgressChange.subscribe((value) => {
      this.requestsInProgress = value;
    });
  }

  get<T>(path: string, server: string = this.server): Observable<T> {
    const queryObservable = this.httpClient
      .get<T>(`${server}/${path}`, this.getHeaders())
      .pipe(share());
    this.trackLoadingStatus(queryObservable);
    return queryObservable;
  }

  post<T>(
    path: string,
    data?: Object,
    headers: Object = this.getHeaders(),
    server: string = this.server,
  ): Observable<T> {
    const queryObservable = this.httpClient
      .post<T>(`${server}/${path}`, data, headers)
      .pipe(share());
    this.trackLoadingStatus(queryObservable);
    return queryObservable;
  }

  patch<T>(path: string, data?: Object, server: string = this.server): Observable<T> {
    const queryObservable = this.httpClient
      .patch<T>(`${server}/${path}`, data, this.getHeaders())
      .pipe(share());
    this.trackLoadingStatus(queryObservable);
    return queryObservable;
  }

  delete<T>(path: string, data?: Object, server: string = this.server): Observable<T> {
    const queryObservable = this.httpClient
      .delete<T>(`${server}/${path}`, this.getHeaders())
      .pipe(share());
    this.trackLoadingStatus(queryObservable);
    return queryObservable;
  }

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        token: this.cookieService.get('token') || '',
      }),
    };
  }

  private trackLoadingStatus(observable: Observable<Object>): void {
    this.requestsInProgressChange.next(this.requestsInProgress + 1);
    observable
      .pipe(
        catchError((error) => of(this.handleError(error))),
        finalize(() => this.requestsInProgressChange.next(this.requestsInProgress - 1)),
      )
      .subscribe();
  }

  private handleError(error: any) {
    if (error.status == 401) {
      this.router.navigate(['/logout']);
    }
  }
}
