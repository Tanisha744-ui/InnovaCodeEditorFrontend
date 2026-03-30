import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CodeExecutionService } from '../Service/code-execution.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-leetcode-question',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leetcode-question.component.html',
  styleUrls: ['./leetcode-question.component.css']
})
export class LeetCodeQuestionComponent implements OnInit {
  question: any = null;

  constructor(
    private route: ActivatedRoute,
    private codeExecutionService: CodeExecutionService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.codeExecutionService.getQuestions().subscribe(qs => {
      this.question = qs.find((q: any) => q.id === id);
    });
  }
}
