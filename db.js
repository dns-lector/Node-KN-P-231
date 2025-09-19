// Робота з базами даних
//     -----SELECT *--------->
// JS <---Driver(Connector)--> DBMS
//    <-------Data-----------
// встановлюємо додатковий пакет (бібліотеку)
// npm i mysql2
// *якщо це перший модуль, що додається, то слід
//  додати запис "type": "module" до файлу package.json
import * as mysql2 from 'mysql2';

// задаємо дані для підключення до БД
const connectionData = {
    host: 'localhost',
    port: 3308,  // 3306
    user: 'user_231',
    password: 'pass_231',
    database: 'node_231',
    charset: 'utf8mb4'
};

// Connection pool - набір встановлених підключень,
// які можуть повторно використовуватись.
const dbPool = mysql2.createPool(connectionData).promise();

// виконання запитів
/* await dbPool.query("SHOW DATABASES")
.then( ([data, fieldsList]) => {
    console.log(data);
    console.log(fieldsList);
})
.catch( console.error );

await dbPool.query("SELECT CURRENT_TIMESTAMP")
.then( ([data, fieldsList]) => {
    console.log(data);
    console.log(fieldsList);
})
.catch( console.error );
*/
const sql = `CREATE TABLE product_groups (
    id        CHAR(36) PRIMARY KEY,
    parent_id CHAR(36) NULL,
    name      VARCHAR(64) NOT NULL 
) ENGINE = InnoDB  DEFAULT CHARSET = utf8mb4`;

await dbPool.query(sql)
.then( ([data, fieldsList]) => {
    console.log(data);
    console.log(fieldsList);
})
.catch( console.error );

dbPool.end();

/*
Товарні групи. Організувати збереження у БД структури
Побутова техніка 
 - Для вани
   = Пральні машини
   = Сушарки
   = 
 - Для кухні
   = Холодильники
   = Посудомийки
 - Для прибирання
   = Пилососи побутов
   = Пилососи-машини
Комп'ютерна техніка
 - Ноутбуки
 - Десктопи
 - Аксесуари
   = Витратні матеріали
     ~ Для принтерів 
       * Чорнила
       * Тонери
     ~ Папір
     ~ Серветки для чищення
   = Носії даних
   = Сумки, рюкзаки
Меблі
 - Корпусні
 - М'які
*/

/*
Механізм parent_id - зазначення зв'язку з цією ж таблицею, 
тільки з іншим записом.
[product_groups]
 [id]
 [parent_id]
 [name]

 Д.З. Засобами NodeJS (запитами)
 - створити таблицю БД random_items з полями
    (int_val, float_val, str_val)
 - заповнити таблицю кількома записами з 
    (випадкое ціле, випадкове дробове, випадковий рядок)
 - вивести вміст таблиці на консоль
 До звіту додати скріншот консолі з результатами      


*/