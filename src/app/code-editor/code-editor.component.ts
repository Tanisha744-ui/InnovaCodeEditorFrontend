import { AfterViewInit, Component, Inject, PLATFORM_ID, ApplicationRef, ViewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CodeExecutionService } from '../Service/code-execution.service';
import { timeout } from 'rxjs/operators';
import { ChangeDetectorRef, NgZone } from '@angular/core';


declare const monaco: any;

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent implements AfterViewInit {
  @ViewChild('leetcodeSidebar') leetcodeSidebar!: ElementRef;
  public hasRun: boolean = false;
  // Test case results for LeetCode mode
  public testResults: Array<{input: string, expected: string, actual: string, pass: boolean}> = [];
  // LeetCode mode state
  questions: any[] = [];
  selectedQuestion: any = null;
  public isDarkMode = true;
  public mode: 'simple' | 'leetcode' = 'simple';

      setMode(newMode: 'simple' | 'leetcode') {
        this.mode = newMode;
        this.cd.detectChanges();
        this.appRef.tick();
        if (newMode === 'leetcode') {
          if (this.questions.length === 0) {
            this.loadQuestions();
          }
          this.selectedQuestion = null;
          setTimeout(() => {
            if (this.leetcodeSidebar) {
              this.leetcodeSidebar.nativeElement.focus();
            }
          }, 100);
        }
        setTimeout(() => this.initOrUpdateMonaco(true), 50);
      }

      loadQuestions() {
        this.codeExecutionService.getQuestions().subscribe({
          next: (qs) => {
            this.zone.run(() => {
              this.questions = qs;
              this.cd.detectChanges();
              setTimeout(() => {
                this.cd.detectChanges();
                if (this.leetcodeSidebar) {
                  this.leetcodeSidebar.nativeElement.focus();
                }
              }, 0);
            });
          },
          error: () => {
            this.zone.run(() => {
              this.questions = [];
              this.selectedQuestion = null;
              this.cd.detectChanges();
            });
          }
        });
      }

      selectQuestion(q: any) {
        this.selectedQuestion = q;
        this.testResults = [];
        this.hasRun = false;
        setTimeout(() => this.initOrUpdateMonaco(true), 50);
      }
      toggleMode(): void {
        this.isDarkMode = !this.isDarkMode;
        this.testResults = [];
        this.hasRun = false;
        const theme = this.isDarkMode ? 'vs-dark' : 'vs-light';
        if (this.editor) {
          monaco.editor.setTheme(theme);
        }
        // Change body class for global styles
        document.body.classList.toggle('light-mode', !this.isDarkMode);
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        setTimeout(() => this.initOrUpdateMonaco(true), 50);
      }
      // ...existing code...
    addFile(): void {
      const newFileName = `File${this.files.length + 1}.cs`;
      this.files.push({ fileName: newFileName, code: '' });
      this.selectedFileIndex = this.files.length - 1;
      setTimeout(() => {
        if (this.editor) this.editor.setValue('');
      });
    }

    removeFile(index: number): void {
      if (this.files.length <= 1) return;
      this.files.splice(index, 1);
      if (this.selectedFileIndex >= this.files.length) {
        this.selectedFileIndex = this.files.length - 1;
      }
      setTimeout(() => {
        if (this.editor) this.editor.setValue(this.files[this.selectedFileIndex].code);
      });
    }

    selectFile(index: number): void {
      this.selectedFileIndex = index;
      if (this.editor) this.editor.setValue(this.files[index].code);
    }
  public files: Array<{ fileName: string; code: string }> = [
    { fileName: 'Program.cs', code: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello World");
        Console.WriteLine(10 + 20);
    }
}` }
  ];
  public selectedFileIndex = 0;
  public output = '';
  public userInput: string = '';
  private editor: any;
  editorFlex = 1;
  outputFlex = 0.4;
  private resizing = false;
  private resizingEnabled = false;
  private startY = 0;
  private startEditorHeight = 0;
  private startOutputHeight = 0;
  editorHeight = 350; // initial height in px
  outputHeight = 180; // initial height in px
  selectedLanguage: string = 'csharp';
  editorOptions: any = {
    theme: 'vs-dark',
    language: 'csharp',
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: false },
  };

  constructor(
    private codeExecutionService: CodeExecutionService,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private zone:NgZone,
    private router: Router,
    private appRef: ApplicationRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  runCode() {
    if (this.editor) {
      this.files[this.selectedFileIndex].code = this.editor.getValue();
    }
    if (this.mode === 'leetcode' && this.selectedQuestion && this.selectedQuestion.examples) {
      this.testResults = [];
      this.hasRun = true;
      const examples = this.selectedQuestion.examples;
      let completed = 0;
      for (const ex of examples) {
        this.codeExecutionService.executeCode(this.files, ex.input)
          .pipe(timeout(10000))
          .subscribe({
            next: res => {
              const actual = (res.output || '').trim();
              const expected = (ex.output || '').trim();
              const pass = actual === expected;
              this.zone.run(() => {
                this.testResults.push({
                  input: ex.input,
                  expected: expected,
                  actual: actual,
                  pass: pass
                });
                completed++;
                if (completed === examples.length) {
                  this.cd.detectChanges();
                }
              });
            },
            error: err => {
              this.zone.run(() => {
                this.testResults.push({
                  input: ex.input,
                  expected: ex.output,
                  actual: err.error?.message || 'Execution failed or timed out',
                  pass: false
                });
                completed++;
                if (completed === examples.length) {
                  this.cd.detectChanges();
                }
              });
            }
          });
      }
    } else {
      // Simple mode: just run and show output
      this.codeExecutionService.executeCode(this.files, this.userInput)
        .pipe(timeout(10000))
        .subscribe({
          next: res => {
            this.zone.run(() => {
              this.output = res.output;
              this.cd.detectChanges();
            });
          },
          error: err => {
            this.zone.run(() => {
              this.output = err.error?.message || 'Execution failed or timed out';
              this.cd.detectChanges();
            });
          }
        });
    }
  }

  ngAfterViewInit() {
    this.initOrUpdateMonaco(false);
  }

  /**
   * Initialize or update Monaco editor. If forceLayout is true, will call layout and focus after creation.
   */
  initOrUpdateMonaco(forceLayout: boolean = false) {
    if (isPlatformBrowser(this.platformId)) {
      const initMonaco = () => {
        (window as any).require.config({
          paths: { vs: 'assets/monaco-editor/min/vs' }
        });

        (window as any).require(['vs/editor/editor.main'], () => {
          // Use the correct container based on mode
          let containerId = this.mode === 'leetcode' ? 'monaco-container-leetcode' : 'monaco-container-simple';
          const container = document.getElementById(containerId);
          if (!container) return;
          // Dispose previous editor if exists
          if (this.editor) {
            this.editor.dispose();
          }
          this.editor = monaco.editor.create(
            container,
            {
              value: this.files[this.selectedFileIndex].code,
              language: 'csharp',
              theme: this.isDarkMode ? 'vs-dark' : 'vs-light',
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: false }
            }
          );

          this.editor.onDidChangeModelContent(() => {
            this.files[this.selectedFileIndex].code = this.editor.getValue();
          });

          // Focus and layout the editor to ensure cursor appears
          if (forceLayout) {
            setTimeout(() => {
              this.editor.layout();
              this.editor.focus();
            }, 10);
          } else {
            this.editor.focus();
          }

          this.initResizableConsole();
        });
      };

      if (!(window as any).require) {
        const loaderScript = document.createElement('script');
        loaderScript.src = 'assets/monaco-editor/min/vs/loader.js';
        loaderScript.onload = initMonaco;
        document.body.appendChild(loaderScript);
      } else {
        initMonaco();
      }
    }
  }

  /** 🔥 Output console resize logic */
  initResizableConsole() {
    const resizer = document.querySelector('.resizer') as HTMLElement;
    const output = document.querySelector('.output-container') as HTMLElement;

    let isDragging = false;

    resizer.addEventListener('mousedown', () => {
      isDragging = true;
      document.body.style.cursor = 'row-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const newHeight = window.innerHeight - e.clientY;
      output.style.height = `${Math.max(newHeight, 120)}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.body.style.cursor = 'default';
    });
  }

  startResizing(event: MouseEvent): void {
    this.resizing = true;
    this.startY = event.clientY;
    this.startEditorHeight = this.editorHeight;
    this.startOutputHeight = this.outputHeight;
    document.addEventListener('mousemove', this.onResizing);
    document.addEventListener('mouseup', this.stopResizing);
  }

  onResizing = (event: MouseEvent): void => {
    if (!this.resizing) return;
    const deltaY = event.clientY - this.startY;
    const newEditorHeight = this.startEditorHeight + deltaY;
    const newOutputHeight = this.startOutputHeight - deltaY;
    if (newEditorHeight > 100 && newOutputHeight >= 0) {
      this.editorHeight = newEditorHeight;
      this.outputHeight = newOutputHeight;
    }
  };

  stopResizing = (): void => {
    this.resizing = false;
    this.resizingEnabled = false; // Disable further resizing until next double-click
    document.removeEventListener('mousemove', this.onResizing);
    document.removeEventListener('mouseup', this.stopResizing);
  };

  enableResizing(): void {
    this.resizingEnabled = true;
  }

  maybeStartResizing(event: MouseEvent): void {
    if (!this.resizingEnabled) return;
    this.startResizing(event);
  }

  public renamingIndex: number | null = null;

  startRename(index: number): void {
    this.renamingIndex = index;
  }

  finishRename(index: number): void {
    this.onFileNameBlur(index);
    this.renamingIndex = null;
  }

  onFileNameBlur(index: number): void {
    // Optionally, add logic to validate or update the file name here.
    // For now, this is a placeholder to resolve the error.
  }

  // Example method to run bracket validation test cases
  runBracketValidationTests(): void {
    const testCases = [
      { input: '(]', expected: false },
      { input: '()[]{}', expected: true },
      { input: '((()))', expected: true },
      { input: '([)]', expected: false },
      { input: '{[]}', expected: true }
    ];

    testCases.forEach(tc => {
      this.codeExecutionService.getFromApi<boolean>('BracketValidation/isvalid', { s: tc.input })
        .subscribe(result => {
          console.log(`Input: ${tc.input}, Expected: ${tc.expected}, Got: ${result}`);
        });
    });
  }
}
