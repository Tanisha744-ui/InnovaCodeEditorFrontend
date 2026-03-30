import { Routes } from '@angular/router';
import { CodeEditorComponent } from './code-editor/code-editor.component';
import { LeetCodeQuestionComponent } from './leetcode-question/leetcode-question.component';

export const routes: Routes = [
	{ path: '', component: CodeEditorComponent },
	{ path: 'leetcode/:id', component: LeetCodeQuestionComponent },
];
