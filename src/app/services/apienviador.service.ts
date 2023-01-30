import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApienviadorService {
  // Local EnviadorAPI Whatsapp
  url: string = 'http://localhost:3001';

  constructor(public http: HttpClient) { }

  post(path: string, body: any) {
    return this.http.post(this.url + '/' + path, body);
  };
}
