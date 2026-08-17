/**
 * @typedef {Object} QueuedTask
 * @property {(...args: any[]) => Promise<any>|Promise<any>} task - The async task to execute.
 * @property {(value: any) => any} resolve - The resolve function from the Promise.
 * @property {(reason?: any) => any} reject - The reject function from the Promise.
 * @property {string|undefined} [id] - Optional identifier for the task.
 * @property {string|null|undefined} [marker] - Optional marker for the task.
 * @property {number|null|undefined} [delay] - Optional delay (in ms) before the task is executed.
 */

/**
 * A queue system for managing and executing asynchronous tasks sequentially, one at a time.
 *
 * Tasks can be delayed, reordered, canceled, and processed in strict order. The queue ensures that each task
 * is executed after the previous one finishes, and any task can be skipped or canceled if needed.
 *
 * @class
 */
class TinyPromiseQueue {
  /** @type {QueuedTask[]} */
  #queue = [];
  #running = false;
  /** @type {Record<string, ReturnType<typeof setTimeout>>} */
  #timeouts = {};
  /** @type {Set<string>} */
  #blacklist = new Set();

  /**
   * Returns whether the queue is currently processing a task.
   *
   * @returns {boolean}
   */
  isRunning() {
    return this.#running;
  }

  /**
   * Processes the a normal task.
   *
   * @param {QueuedTask} data
   *
   * @returns {Promise<void>}
   */
  async #normalProcessQueue(data) {
    if (
      data &&
      typeof data.task === 'function' &&
      typeof data.resolve === 'function' &&
      typeof data.reject === 'function'
    ) {
      const { task, resolve, reject, delay, id } = data;
      try {
        if (id && this.#blacklist.has(id)) {
          reject(new Error('The function was canceled on TinyPromiseQueue.'));
          this.#blacklist.delete(id);
          this.#running = false;
          this.#processQueue();
          return;
        }

        if (delay && id) {
          await new Promise((resolveDelay) => {
            const timeoutId = setTimeout(() => {
              delete this.#timeouts[id];
              resolveDelay(null);
            }, delay);
            this.#timeouts[id] = timeoutId;
          });
        }

        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.#running = false;
        this.#processQueue();
      }
    }
  }

  /**
   * Processes a group task.
   *
   * @returns {Promise<void>}
   */
  async #groupProcessQueue() {
    /** @type {Array<QueuedTask>} */
    const grouped = [];
    while (this.#queue.length && this.#queue[0]?.marker === 'POINT_MARKER') {
      // @ts-ignore
      grouped.push(this.#queue.shift());
    }

    if (grouped.length === 0) {
      this.#running = false;
      this.#processQueue();
      return;
    }

    await Promise.all(
      grouped.map(
        ({ task, resolve, reject, id }) =>
          new Promise(async (pResolve) => {
            if (id && this.#blacklist.has(id)) {
              this.#blacklist.delete(id);
              reject(new Error('The function was canceled on TinyPromiseQueue.'));
              pResolve(true);
              return;
            }
            await task().then(resolve).catch(reject);
            pResolve(true);
          }),
      ),
    );

    this.#running = false;
    this.#processQueue();
  }

  /**
   * Processes the next task in the queue if not already running.
   * Ensures tasks are executed in order, one at a time.
   *
   * @returns {Promise<void>}
   */
  async #processQueue() {
    if (this.#running || this.#queue.length === 0) return;
    this.#running = true;
    if (typeof this.#queue[0]?.marker !== 'string' || this.#queue[0]?.marker !== 'POINT_MARKER') {
      const data = this.#queue.shift();
      // @ts-ignore
      this.#normalProcessQueue(data);
    } else this.#groupProcessQueue();
  }

  /**
   * Returns the index of a task by its ID.
   *
   * @param {string} id The ID of the task to locate.
   * @returns {number} The index of the task in the queue, or -1 if not found.
   */
  getIndexById(id) {
    return this.#queue.findIndex((item) => item.id === id);
  }

  /**
   * Returns a list of IDs for all tasks currently in the queue.
   *
   * @returns {{ index: number, id: string }[]} An array of task IDs currently queued.
   */
  getQueuedIds() {
    // @ts-ignore
    return this.#queue
      .map((item, index) => ({ index, id: item.id }))
      .filter((entry) => typeof entry.id === 'string');
  }

  /**
   * Reorders a task in the queue from one index to another.
   *
   * @param {number} fromIndex The current index of the task to move.
   * @param {number} toIndex The index where the task should be placed.
   */
  reorderQueue(fromIndex, toIndex) {
    if (
      typeof fromIndex !== 'number' ||
      typeof toIndex !== 'number' ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.#queue.length ||
      toIndex >= this.#queue.length
    )
      return;
    const [item] = this.#queue.splice(fromIndex, 1);
    this.#queue.splice(toIndex, 0, item);
  }

  /**
   * Inserts a point in the queue where subsequent tasks will be grouped and executed together in a Promise.all.
   * If the queue is currently empty, behaves like a regular promise.
   *
   * @template {any} PromiseResult
   * @param {(...args: any[]) => Promise<PromiseResult>} task A function that returns a Promise.
   * @param {string} [id] Optional ID to identify the task in the queue.
   * @returns {Promise<PromiseResult>} A Promise that resolves or rejects with the result of the task once it's processed.
   * @throws {Error} Throws if param is invalid.
   */
  async enqueuePoint(task, id) {
    if (typeof task !== 'function')
      return Promise.reject(new Error('Task must be a function returning a Promise.'));
    if (typeof id !== 'undefined' && typeof id !== 'string')
      throw new Error('The "id" parameter must be a string.');
    if (!this.#running) return task();
    return new Promise((resolve, reject) => {
      this.#queue.push({ marker: 'POINT_MARKER', task, resolve, reject, id });
      this.#processQueue();
    });
  }

  /**
   * Adds a new async task to the queue and ensures it runs in order after previous tasks.
   * Optionally, a delay can be added before the task is executed.
   *
   * If the task is canceled before execution, it will be rejected with the message:
   * "The function was canceled on TinyPromiseQueue."
   *
   * @template {any} PromiseResult
   * @param {(...args: any[]) => Promise<PromiseResult>} task A function that returns a Promise to be executed sequentially.
   * @param {number|null} [delay] Optional delay (in ms) before the task is executed.
   * @param {string} [id] Optional ID to identify the task in the queue.
   * @returns {Promise<PromiseResult>} A Promise that resolves or rejects with the result of the task once it's processed.
   * @throws {Error} Throws if param is invalid.
   */
  enqueue(task, delay, id) {
    if (typeof task !== 'function')
      return Promise.reject(new Error('Task must be a function returning a Promise.'));
    if (typeof delay !== 'undefined' && (typeof delay !== 'number' || delay < 0))
      return Promise.reject(new Error('Delay must be a positive number or undefined.'));
    if (typeof id !== 'undefined' && typeof id !== 'string')
      throw new Error('The "id" parameter must be a string.');

    return new Promise((resolve, reject) => {
      this.#queue.push({ task, resolve, reject, id, delay });
      this.#processQueue();
    });
  }

  /**
   * Cancels a scheduled delay and removes the task from the queue.
   * Adds the ID to a blacklist so the task is skipped if already being processed.
   *
   * @param {string} id The ID of the task to cancel.
   * @returns {boolean} True if a delay was cancelled and the task was removed.
   * @throws {Error} Throws if `id` is not a string.
   */
  cancelTask(id) {
    if (typeof id !== 'string') throw new Error('The "id" parameter must be a string.');
    let cancelled = false;

    if (id in this.#timeouts) {
      clearTimeout(this.#timeouts[id]);
      delete this.#timeouts[id];
      cancelled = true;
    }

    const index = this.getIndexById(id);
    if (index !== -1) {
      const [removed] = this.#queue.splice(index, 1);
      removed?.reject?.(new Error('The function was canceled on TinyPromiseQueue.'));
      cancelled = true;
    }

    if (cancelled) this.#blacklist.add(id);

    return cancelled;
  }
}

export default TinyPromiseQueue;
