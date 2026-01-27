import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class CodeExecutionService {
  private apiUrl = 'https://localhost:5143/api/CodeExecution/execute';
  constructor(private http: HttpClient) {}
  executeCode(code: string) {
    return this.http.post<{ output: string }>(
      this.apiUrl,
      { code },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}