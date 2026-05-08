import React, { useEffect, useState } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";
import "./App.css";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const store = new LazyStore("todos.json");

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTodos = async () => {
      const saved = await store.get<Todo[]>("todos");
      if (saved) {
        setTodos(saved);
      }
      setIsLoaded(true);
    };

    loadTodos();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const saveTodos = async () => {
        store.set("todos", todos);
        store.save();
      };

      saveTodos();
    }
  }, [todos, isLoaded]);

  function addTodo(e?: React.FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value) return;
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: value,
      completed: false,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setText("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <main className="container">
      <section className="todo-app">
        <div className="todo-header">
          <h1>Todo — Tauri + React</h1>
          <div className="counter">{remaining} remaining</div>
        </div>

        <form className="todo-form" onSubmit={addTodo}>
          <input
            className="todo-input"
            placeholder="What needs to be done?"
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
          />
          <button type="submit">Add</button>
        </form>

        <ul className="todo-list">
          {todos.length === 0 && (
            <li style={{ padding: "1rem", color: "#666" }}>
              No tasks yet — add one!
            </li>
          )}
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`todo-item ${todo.completed ? "completed" : ""}`}
            >
              <div className="left">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <div className="text">{todo.text}</div>
              </div>
              <div>
                <button
                  className="delete-button"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`Delete ${todo.text}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
