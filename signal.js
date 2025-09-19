/* Поєднання можливостей подій (сигналів) та промісів
дозволяють створювати контрольовані задачі (з можливістю
їх переривання)
*/
import {time} from './helper.js';

function delay(timeout, signal) {
    return new Promise((resolve, reject) => {
        var handle = setTimeout(resolve, timeout);
        if(signal instanceof AbortSignal) {
            signal.addEventListener("abort", () => {
                clearTimeout(handle);
                reject(signal.reason);
            });
        }
    });
}

const controller = new AbortController();
console.log(time(), "Start")
delay(1000000, controller.signal)
.then(() => console.log(time(), "Finish"))
.catch(err => console.error(time(), "Delay rejected with reason:", err));

delay(3000).then(() => controller.abort("Window closed"));
// створення події, яка відобразиться на controller