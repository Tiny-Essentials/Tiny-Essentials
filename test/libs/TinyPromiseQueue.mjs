import TinyPromiseQueue from '../../dist/v1/libs/utils/TinyPromiseQueue.mjs';

const executeTinyPromiseQueue = async () => {
  await new Promise((resolve) => {
    // Create a new queue instance
    const queue = new TinyPromiseQueue();

    // Helper function to create tasks with log output
    const createTask =
      (name, duration = Math.floor(Math.random() * 1000 + 1)) =>
      () =>
        new Promise((resolveTask) => {
          console.log(`\x1b[34mStarted task:\x1b[0m \x1b[32m${name}\x1b[0m`);
          setTimeout(() => {
            console.log(`\x1b[33mFinished task:\x1b[0m \x1b[32m${name}\x1b[0m`);
            resolveTask(name);
          }, duration);
        });

    // Enqueue a normal task
    queue.enqueue(createTask('A'), 100, 'taskA');

    // Enqueue a grouped set of tasks with enqueuePoint
    queue.enqueuePoint(createTask('Group-1'), 'groupTask1');
    queue.enqueuePoint(createTask('Group-2'), 'groupTask2').catch(() => {});
    queue.enqueuePoint(createTask('Group-3'), 'groupTask3');

    // Enqueue another normal task
    queue.enqueue(createTask('B'), 0, 'taskB').catch(() => {});

    // Enqueue a final task to trigger the resolve
    queue.enqueue(createTask('C'), 0, 'taskC');
    queue.enqueue(createTask('D'), 0, 'taskD').then(() => resolve());

    // Cancel one of the group tasks
    setTimeout(() => {
      const success1 = queue.cancelTask('taskB');
      const success2 = queue.cancelTask('groupTask2');
      console.log(`\x1b[31mCanceled taskB:\x1b[0m \x1b[32m${success1}\x1b[0m`);
      console.log(`\x1b[31mCanceled groupTask2:\x1b[0m \x1b[32m${success2}\x1b[0m`);
    }, 50);

    // List remaining tasks in queue
    setTimeout(() => {
      const ids = queue.getQueuedIds();
      console.log(`\x1b[36mQueued IDs:\x1b[0m`, ids);
    }, 60);
  });
};

export default executeTinyPromiseQueue;
