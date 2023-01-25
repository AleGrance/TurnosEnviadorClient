import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MetrepayServiceService {
  // URL MetrepayTEST
  url: string = 'https://test.metrepay.com/api';
  apiToken = '35dd7b33-3c2a-48a4-827f-042e57c9c3b8';

  // Headers
  headers = new HttpHeaders()
    .set('content-type', 'application/json')
    .set('Api-Token', this.apiToken);

  constructor(public http: HttpClient) {}

  get(path: any) {
    return this.http.get(this.url + '/' + path, {
      headers: this.headers,
    });
  }

  post(path: string, body: any) {
    return this.http.post(this.url + '/' + path, body);
  }

  // put(path: string, body: any) {
  //   return this.http.put(this.url + '/' + path, body);
  // }

  // delete(path: string) {
  //   return this.http.delete(this.url + '/' + path);
  // };
}
