import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class CodeExecutionService {
  private apiUrl = 'http://localhost:5143/api/CodeExecution/execute';
  constructor(private http: HttpClient) {}
  executeCode(files: { fileName: string, code: string }[], input: string) {
    return this.http.post<{ output: string }>(
      this.apiUrl,
      { files, input },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}