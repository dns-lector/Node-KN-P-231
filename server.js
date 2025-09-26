import http from "http";
import * as fs from 'node:fs/promises';
import mysql2 from 'mysql2'
import GroupDao from './dao/groupDao.js'
import { getAllowedMimeType } from "./helper.js";


const dbiniFilename = "db.ini"
const HTTP_PORT = 81;
const CONTROLLERS_PATH = './controllers/';
const CONTROLLER_FILE_SUFFIX = '_controller.js';

// Load Controllers
const controllers = {};
const loadControllersTask = fs.readdir(CONTROLLERS_PATH)
.then(async filenames => {
    for(let filename of filenames) {
        let pos = filename.indexOf(CONTROLLER_FILE_SUFFIX);
        if(pos != -1) {
            const controllerName = filename.substring(0, pos);
            controllers[controllerName] = (await 
                import(CONTROLLERS_PATH + filename)
            ).default;
        }
    }
});
const apiControllers = {};
const apiPath = CONTROLLERS_PATH + "api/";
const loadApiControllersTask = fs.readdir(apiPath)
.then(async filenames => {
    for(let filename of filenames) {
        let pos = filename.indexOf(CONTROLLER_FILE_SUFFIX);
        if(pos != -1) {
            const controllerName = filename.substring(0, pos);
            apiControllers[controllerName] = (await 
                import(apiPath + filename)
            ).default;
        }
    }
});

// CONNECT TO DB
const dbFile = await fs.open(dbiniFilename, "r");
let dbConfig = {};
for await (let line of dbFile.readLines()) {
    let parts = line.split("#")
    line = parts[0]
    parts = line.split(";")
    line = parts[0]
    parts = line.split("=")
    if(parts.length != 2 ) continue
    dbConfig[parts[0].trim()] = parts[1].trim()
}
const dbPool = mysql2.createPool(dbConfig).promise();
const groupDao = new GroupDao(dbPool)


async function serverFunction(request, response) {
    // console.log(request);
    let parts = request.url.split("?");
    if(parts.length > 2) {
        response.writeHead(400);
        response.end("Bad request");
        return;
    }
    const path = parts[0]
    // console.log(path)

    // static files
    if( ! path.endsWith('/')) {
        let contentType = getAllowedMimeType(path);
         if(contentType != null) {   
            const filePath = "./wwwroot" + path;
            try {
                await fs.access(filePath);
                const stat = await fs.stat(filePath);

                if (stat.isFile()) {
                //console.log(filePath);

                response.writeHead(200, {
                    'Content-Type': contentType
                });
                // piping - передача даних від потоку читання до потоку запису
                (await fs.open(filePath, "r")).createReadStream().pipe(response);
                return;
                }
            }
            catch(_) {  }
        }
    }

    // controller routing
    let components = path.split("/", 4);
    let controller, action, id;
    // оскільки всі запити починаються з /, то перший елемент масиву буде порожнім
    if (components[1].length > 0) {
        controller = components[1].toLowerCase();
    }
    else {
        controller = "home";
    }
    if (components.length > 2 && components[2].length > 0) {
        action = components[2].toLowerCase();
    }
    else {
        action = "index";
    }
    if (components.length > 3 ) {
        id = components[3];
    }
    else {
        id = null;
    }
    // console.log(controller, action, id);
    if(controller == 'api') {
        if(typeof apiControllers[action] == 'function') {
            const apiControllerObject = new apiControllers[action];
            // injection
            apiControllerObject.dbPool = dbPool;
            const apiAction = "do" + request.method.charAt(0).toUpperCase()
             + request.method.slice(1).toLowerCase();
             
            if(typeof apiControllerObject[apiAction] == 'function') {
                apiControllerObject[apiAction](request, response, id);
                return;
            }
            else {
                response.writeHead(405);   // 405 Method Not Allowed
                response.end();
                return;
            }
        }
    }
    else if(typeof controllers[controller] == 'function') {
        const controllerObject = new controllers[controller];
        // injection
        controllerObject.dbPool = dbPool;
        if(typeof controllerObject[action] == 'function') {
            controllerObject[action](request, response, id);
            return;
        }
        else {
            response.writeHead(406);  // 406 Not Acceptable
            response.end();
            return;
        }
    }
    else {
        response.writeHead(404);
        response.end();
        return;
    }
}








const server = http.createServer(serverFunction);
server.on('close', () => {
    console.log("Server stopped");
    process.exit(); 
});

process.on('SIGINT', () => {
    server.close();
});

await loadControllersTask;
await loadApiControllersTask;
console.log(controllers, apiControllers);

server.listen(HTTP_PORT, () => {
    console.log("Server listening port ", HTTP_PORT);
    console.log(`http://localhost:${HTTP_PORT}`);
    console.log("Press Ctrl-C to stop");
});