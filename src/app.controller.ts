import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getHello() {
    return { success: true, message: 'Everything is fine' };
  }
  
  @Get('my-todo-list')
  getToDoList() {
    return [
      {"id": 1, "text": "task 1"},
      {"id": 2, "text": "task 2"},
    ];
  }
}
