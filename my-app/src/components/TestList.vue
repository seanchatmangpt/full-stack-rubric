<script setup>
import {onMounted, ref} from "vue";

const count = ref(0)
let id = 0

const newTodo = ref('')
const todos = ref([
  {id: id++, text: 'Learn HTML'},
  {id: id++, text: 'Learn JavaScript'},
  {id: id++, text: 'Learn Vue'},
])

function addTodo(e) {
  console.log(e.target.value)
  todos.value.push({
    id: id++,
    text: newTodo.value
  })
}

function removeTodo(e) {
  console.log(e)
  todos.value = todos.value.filter((todo) => {
    return todo.id !== e.id
  })
}

</script>
<template>
  <input v-model="newTodo" placeholder="New todo" @keydown.enter="addTodo" autofocus>
  <button @click="addTodo">Add Todo</button>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      {{todo.text}}
      <button @click="removeTodo(todo)">X</button>
    </li>
  </ul>
  <pre>{{todos}}</pre>
</template>
<style>
button {
  font-weight: bold;
}
#title {
  color: red;
}
</style>