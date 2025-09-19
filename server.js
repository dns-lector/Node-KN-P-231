import http     from "http";
import * as fs  from 'node:fs/promises';
import mysql2   from 'mysql2';
import { getAllowedMimeType } from "./helper.js";
// import GroupDao from './dao/groupDao.js';

const dbIniFilename = "db.ini";
const HTTP_PORT = 81;
// Connect to DB
const dbIniFile = await fs.open(dbIniFilename, "r");
let dbConfig = {};
for await (let line of dbIniFile.readLines()) {
    let parts = line.split('#');
    line = parts[0];
    parts = line.split(';');
    line = parts[0];
    parts = line.split('=');
    if(parts.length != 2) continue;
    dbConfig[parts[0].trim()] = parts[1].trim();
}
const dbPool = mysql2.createPool(dbConfig).promise();
// const groupDao = new GroupDao(dbPool);
// console.log(dbConfig); process.exit(); 

// Server

async function serverFunction(request, response) {
    let parts = request.url.split("?");
    if(parts.length > 2) {
        response.writeHead(400);
        response.end("Bad request");
        return;
    }
    const path = parts[0];
    console.log(path);

    // Static files: перевірка того, що запит відповідає імені існуючого файла
    if( ! path.endsWith('/')) {
        let contentType = getAllowedMimeType(path);
         if(contentType != null) {      // якщо тип належить до дозволених      
            const filePath = "./wwwroot" + path;
            try {
                await fs.access(filePath);
                const stat = await fs.stat(filePath);
                if(stat.isFile()) {
                    console.log(filePath);
                    // piping - передача даних від потоку читання до потоку запису
                    (await fs.open(filePath, "r")).createReadStream().pipe(response);
                    response.writeHead(200, {
                        'Content-Type': contentType
                    });
                    // response.end();
                    return;
                }            
            }
            catch(_) {  }
        }
    }

    // Якщо запит не є файлом, то запит проходить маршрутизацію
    // Однією з традицій є поділ /controller/action/id
    let components = path.split("/", 4);
    // оскільки всі запити починаються з "/", нульовий елемент поділу буде порожнім
    let controller, action, id;
    if(components[1].length > 0) {
        controller = components[1].toLowerCase();
    }
    else {
        controller = "home";
    }
    if(components.length > 2 && components[2].length > 0) {
        action = components[2].toLowerCase();
    }
    else {
        action = "index";
    }
    if(components.length > 3) {
        id = components[3];
    }
    else {
        id = null;
    }
    console.log(controller, action, id);

    const pageData = {
        method: request.method,
        httpVersion: request.httpVersion,
        url: request.url,
        query: null,
    };
    if(parts.length == 2) {
        pageData.query = parts[1];
    }
    
    pageData.path = parts[0];

    pageData.groupsHtml = ""; // await makeGroupsHtml();
    
    response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });

    const file = await fs.open("home.html", "r");
    let html = (await file.readFile()).toString();
    file.close();
    for(let k in pageData) {
        html = html.replaceAll(`{{${k}}}`, pageData[k]);
    }
    response.end(html);
}

async function makeGroupsHtml() {
    const [data] = await dbPool.query('SELECT * FROM `groups` ');
    let wasChild;
    do {
        wasChild = false;
        for(let i = 0; i < data.length; i+=1) {
            let grp = data[i];
            if(grp["parent_id"] != null) {
                wasChild = true;
                let parent = findParent(data, grp["parent_id"]);
                if(parent == null) {}  // TODO: Передбачити дії якщо не знайдено
                if(typeof parent.sub == 'undefined') {
                    parent.sub = [];
                }
                parent.sub.push(grp);
                data.splice(i,1);
            }
        }
    } while(wasChild);    

    return grpToHtml(data);
}

function grpToHtml(grps) {
    let html = "<ul>";
    for(let grp of grps) {
        html += `<li>${grp.name}`;
        if(typeof grp.sub != 'undefined' && grp.sub.length > 0) {
            html += grpToHtml(grp.sub);
        }
        html += '</li>';
    }
    html += '</ul>';
    return html;
}

function findParent(arr, parent_id) {
    for(let elem of arr) {
        if(elem.id == parent_id) return elem;
        if(typeof elem.sub != 'undefined') {
            let p = findParent(elem.sub, parent_id);
            if(p != null) return p;
        }
    }
    return null;
}

const server = http.createServer(serverFunction);
server.on('close', () => {
    console.log("Server stopped");
    dbPool.end();
    process.exit(); 
});
server.listen(HTTP_PORT, () => {
    console.log("Server listening port ", HTTP_PORT);
    console.log("Press Ctrl-C to stop");
});

process.on('SIGINT', () => {
    server.close();
});
