const Redis = require("ioredis");
const sleep = require("sleep-promise");

const host = process.argv[2];
const port = process.argv[3] | 6379;
const rateLimit = process.argv[4] | 100000;

const task = async (redis, worker) => {
    for (let i = 0; i < 10000; i++) {
        const key = Math.floor(new Date().getTime() / 1000);
        const current = await redis.incr(key);
        if (current == 1) {
            // 10秒で有効期限切れ
            redis.expire(key, 10);
            // 2秒前の結果を出力
            console.log(('  ' + worker).slice(-2) + ":" + (key - 2) + ":" + ('     ' + (await redis.get(key - 2))).slice(-6));
        }
        if (current < rateLimit) {
            // APIを実行する
            // invoke();
        } else {
            // APIは実行せず一定時間スリープ、または失敗として処理終了
            await sleep(500);
        }
    }
};

(async () => {
    const redis = new Redis({ tls: { host, port } });
    const tasks = Array(90);
    for (let i = 0; i < tasks.length; i++) {
        tasks[i] = task(redis, i);
    }
    try {
        await Promise.all(tasks);
    } finally {
        redis.disconnect();
    }
})();