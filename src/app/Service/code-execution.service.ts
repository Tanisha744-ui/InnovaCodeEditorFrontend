import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class CodeExecutionService {
  private apiUrl = 'http://localhost:5143/api/CodeExecution/execute';
  private questionsUrl = 'http://localhost:5143/api/Questions';
  constructor(private http: HttpClient) {}
  getQuestions() {
    return this.http.get<any[]>(this.questionsUrl);
  }
  executeCode(files: { fileName: string, code: string }[], input: string) {
    return this.http.post<{ output: string }>(
      this.apiUrl,
      { files, input },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  /**
   * Generic GET request to any API endpoint with query params.
   * @param endpoint The API endpoint (e.g., 'BracketValidation/isvalid')
   * @param params An object of query parameters
   */
  getFromApi<T>(endpoint: string, params: {[key: string]: any}) {
    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return this.http.get<T>(`http://localhost:5143/api/${endpoint}?${query}`);
  }
}