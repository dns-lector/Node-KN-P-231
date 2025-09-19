import { delay, time } from "./helper.js";
import { EventEmitter } from 'node:events';

// Події - ще один спосіб (поряд з Promise) забезпечення асинхронності
// Розрізняються "слухачі" подій та "джерела" подій

const onStartEvent = 
    () => console.log(time(), "Start event dispatched");
// hoisting - підняття коду. Опис функції піднімається компілятором до початку файлу
function onDataEvent(data) {  // statement - інструкція без результату
    console.log(time(), "Data event dispatched with: ", data);
}
// Операції присвоювання не піднімаються
const onStopEvent = 
    () => console.log(time(), "Stop event dispatched");   // expression - з результатом

const processor = new EventEmitter();
processor.on("start", onStartEvent);
processor.on("data", onDataEvent);
processor.on("stop", onStopEvent);

console.log(time(), "Program start");
await Promise.all([
    delay(1000).then(() => processor.emit("start")),
    delay(3000).then(() => processor.emit("data", "Event Data 1")),
    delay(2000).then(() => processor.emit("data", "Event Data 2")),
    delay(4000).then(() => processor.emit("stop")),
]);

// Рекомендується зняти підписки після роботи
processor.off('start', onStartEvent);
processor.off('data', onDataEvent);
processor.off('stop', onStopEvent);

console.log(time(), "Program stop");
