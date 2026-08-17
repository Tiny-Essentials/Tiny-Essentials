# `TinyPromiseQueue` Documentation 🎉

`TinyPromiseQueue` is a queue system designed to manage and execute asynchronous tasks in a sequential, one-at-a-time order. Tasks are executed in the order they are added to the queue, with support for optional delays ⏳, task cancellation ❌, and task reordering 🔄.

---

## Properties 🏠

- **`#queue`**: The internal queue array that holds all the tasks.
- **`#running`**: A flag indicating whether the queue is currently processing a task.
- **`#timeouts`**: An object storing timeouts for scheduled delays.
- **`#blacklist`**: A set of task IDs that should be skipped if already being processed or canceled.

---

## Methods 🛠️

### `isRunning()` 🏃‍♀️

Returns whether the queue is currently processing a task.

#### Returns:
- `boolean`: `true` if the queue is processing a task, otherwise `false`.

---

### `getIndexById(id)` 🔍

Returns the index of a task in the queue by its ID.

#### Parameters:
- `id` (`string`): The ID of the task to locate.

#### Returns:
- `number`: The index of the task in the queue, or `-1` if not found.

---

### `getQueuedIds()` 📋

Returns a list of IDs for all tasks currently in the queue.

#### Returns:
- `Array<{ index: number, id: string }>`: An array of task IDs and their corresponding indices.

---

### `reorderQueue(fromIndex, toIndex)` 🔄

Reorders a task in the queue from one index to another.

#### Parameters:
- `fromIndex` (`number`): The current index of the task to move.
- `toIndex` (`number`): The index where the task should be placed.

#### Returns:
- `void`: This method does not return anything.

---

### `enqueue(task, delay, id)` ⏳

Adds a new async task to the queue and ensures it runs in order after previous tasks. Optionally, a delay can be added before the task is executed.

If the task is canceled before execution, it will be rejected with the message:
**"The function was canceled on TinyPromiseQueue."**

#### Parameters:
- `task` (`Function`): A function that returns a `Promise` to be executed sequentially.
- `delay` (`number|null`): Optional delay (in ms) before the task is executed.
- `id` (`string`): Optional ID to identify the task in the queue.

#### Returns:
- `Promise<any>`: A promise that resolves or rejects with the result of the task once it's processed.

---

### `enqueuePoint(task, id)` 🪢

Adds an async task to a parallel group in the queue. All tasks added with `enqueuePoint` before the next `enqueue` will be executed **simultaneously**, but only after all previous tasks in the queue have completed.

These grouped tasks share a "concurrent checkpoint" and will run using `Promise.all`. Each task resolves or rejects independently.

If a task is canceled before execution, it will be rejected with the message:  
**"The function was canceled on TinyPromiseQueue."**

#### Parameters:
- `task` (`Function`): A function that returns a `Promise` to be executed sequentially.
- `id` (`string`): Optional ID to identify the task in the queue.

#### Returns:
- `Promise<any>`: A promise that resolves or rejects with the result of the task once it's processed.

---

### `cancelTask(id)` ❌

Cancels a scheduled delay and removes the task from the queue. Adds the ID to a blacklist so the task is skipped if already being processed.

#### Parameters:
- `id` (`string`): The ID of the task to cancel.

#### Returns:
- `boolean`: `true` if a delay was cancelled and the task was removed, otherwise `false`.

---

## Usage Example 💻

```js
import { TinyPromiseQueue } from 'tiny-essentials/libs/utils/TinyPromiseQueue';

const queue = new TinyPromiseQueue();

// Helper function to create simple tasks with logs
function createTask(name, duration = 500) {
  return () => new Promise((resolve) => {
    console.log(`Started task: ${name}`);
    setTimeout(() => {
      console.log(`Finished task: ${name}`);
      resolve(name);
    }, duration);
  });
}

// Enqueue 3 tasks
queue.enqueue(createTask('A'), 100, 'taskA');
queue.enqueue(createTask('B'), 0, 'taskB');
queue.enqueue(createTask('C'), 0, 'taskC');

// Wait for 50ms and cancel taskB
setTimeout(() => {
  const success = queue.cancelTask('taskB');
  console.log('Canceled taskB:', success); // true if cancelled
}, 50);

// List the remaining IDs in the queue
setTimeout(() => {
  const ids = queue.getQueuedIds();
  console.log('Queued IDs:', ids);
}, 60);
```

```js
import { TinyPromiseQueue } from 'tiny-essentials/libs/utils/TinyPromiseQueue';

const queue = new TinyPromiseQueue();
await new Promise((resolve) => {

    // Task generator with color-coded logs
    function createTask(name, duration = 500) {
      return () =>
        new Promise((resolve) => {
          console.log(`\x1b[34m[STARTED]\x1b[0m \x1b[36m${name}\x1b[0m`);
          setTimeout(() => {
            console.log(`\x1b[32m[FINISHED]\x1b[0m \x1b[36m${name}\x1b[0m`);
            resolve(name);
          }, duration);
        });
    }

    // Function to simulate a parallel group of enqueues
    const parallelEnqueueGroup = (groupName, delayStart = 0) => {
        const count = Math.floor(Math.random() * (15 - 1 + 1) + 1);
        for (let i = 1; i <= count; i++) {
          const taskName = `${groupName}-${i}`;
          queue.enqueue(createTask(taskName, 300 + i * 50), delayStart, taskName);
        }
    };

    // Main enqueue block
    queue.enqueue(createTask('Init-1', 400), 50, 'init-1');
    queue.enqueue(createTask('Init-2', 400), 0, 'init-2');

    // Simulate enqueues from other contexts "in parallel"
    parallelEnqueueGroup('Alpha',     80);  // Starts after 80ms
    parallelEnqueueGroup('Beta',     120);  // Starts after 120ms
    parallelEnqueueGroup('Gamma',    250);  // Starts after 250ms
    parallelEnqueueGroup('Delta',    180);  // Starts after 180ms
    parallelEnqueueGroup('Epsilon',  300);  // Starts after 300ms
    parallelEnqueueGroup('Zeta',     160);  // Starts after 160ms
    parallelEnqueueGroup('Eta',       90);  // Starts after 90ms
    parallelEnqueueGroup('Theta',    220);  // Starts after 220ms
    parallelEnqueueGroup('Iota',     140);  // Starts after 140ms
    parallelEnqueueGroup('Kappa',    400);  // Starts after 400ms
    parallelEnqueueGroup('Lambda',   190);  // Starts after 190ms
    parallelEnqueueGroup('Mu',       260);  // Starts after 260ms
    parallelEnqueueGroup('Nu',       110);  // Starts after 110ms
    parallelEnqueueGroup('Xi',       330);  // Starts after 330ms
    parallelEnqueueGroup('Omicron',  170);  // Starts after 170ms
    parallelEnqueueGroup('Pi',       280);  // Starts after 280ms
    parallelEnqueueGroup('Rho',       70);  // Starts after 70ms
    parallelEnqueueGroup('Sigma',    360);  // Starts after 360ms
    parallelEnqueueGroup('Tau',      130);  // Starts after 130ms
    parallelEnqueueGroup('Upsilon',  240);  // Starts after 240ms
    parallelEnqueueGroup('Phi',      310);  // Starts after 310ms
    parallelEnqueueGroup('Chi',      100);  // Starts after 100ms
    parallelEnqueueGroup('Psi',      200);  // Starts after 200ms
    parallelEnqueueGroup('Omega',     50);  // Starts after 50ms

    // Final task to confirm everything executed
    setTimeout(() => {
      queue.enqueue(createTask('Finalizer', 500), 0, 'finalizer').then(() => {
        console.log('\x1b[35m[QUEUE COMPLETE]\x1b[0m All tasks have been processed.');
        resolve();
      });
    }, 250);
});
```

### Explanation 🧩:
1. **Task Creation**: Tasks are created with a name and an optional duration (in ms). The task logs its start and finish times 🕰️.
2. **Task Execution**: Tasks are enqueued one at a time, ensuring they run in the order they were added 🔁.
3. **Cancellation**: After 50ms, taskB is canceled, demonstrating the ability to remove a task from the queue ❌.
4. **Remaining Tasks**: The remaining tasks in the queue are logged after 60ms 📊.

---

## Conclusion 🎯

`TinyPromiseQueue` provides a simple and effective way to manage a sequence of asynchronous tasks. With its support for delays ⏳, task cancellation ❌, and reordering 🔄, it allows for efficient control over task execution in JavaScript.
