'use client';

import { FirestoreTodoRepository } from '@/modules/todo/repositories/firestore-todo.repository';
import { TodoService } from '@/modules/todo/services/todo.service';

const todoRepository = new FirestoreTodoRepository();

export const todoService = new TodoService(todoRepository);
