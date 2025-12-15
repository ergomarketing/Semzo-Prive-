// Sistema de cola para emails con rate limiting
class EmailQueue {
  private queue: Array<() => Promise<void>> = []
  private processing = false
  private lastRequestTime = 0
  private readonly MIN_INTERVAL = 500 // 500ms entre requests (2 req/segundo)

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.processing) {
        this.process()
      }
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime

      if (timeSinceLastRequest < this.MIN_INTERVAL) {
        await new Promise((resolve) => setTimeout(resolve, this.MIN_INTERVAL - timeSinceLastRequest))
      }

      const task = this.queue.shift()
      if (task) {
        this.lastRequestTime = Date.now()
        await task()
      }
    }

    this.processing = false
  }
}

export const emailQueue = new EmailQueue()
