export default class ClientController {

    doGet(request, response, id) {
        response.writeHead(200);
        response.end("ClientController");
    }
    
    doPost(request, response, id) { 
        // Прийом тіла запиту
        let body = "";
        request.on('data', function(chunk) { body += chunk; });
        request.on('end', function() {
            console.log("ClientController::doPost body: " + body);
            console.log(request.headers['content-type']);
            if(typeof request.headers['content-type'] == 'string' &&
                request.headers['content-type'].startsWith('application/json')) {
                    const data = JSON.parse(body);   // десеріалізація - відновлення об'єкту з рядка
                    response.writeHead(200, {
                        'Content-Type': 'application/jso'
                    });
                    response.end(JSON.stringify({
                        "controller": "ClientController",
                        "method": "POST",
                        "semantics": "Create",
                        "body": data
                    }));
            }
            else {
                response.writeHead(415);  // Unsupported Media Type
                response.end();
            }
            
        });
        // response.writeHead(200, {
        //     'Content-Type': 'application/json'
        // });
        // response.end(JSON.stringify({
        //     "controller": "ClientController",
        //     "method": "POST",
        //     "semantics": "Create"
        // }));
    }
    
}