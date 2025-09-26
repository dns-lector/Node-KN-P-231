
import * as fs from 'node:fs/promises';

export default class HomeController {

    async index(request, response, id) {
        let parts = request.url.split("?");
            
        const pageData = {
            method: request.method,
            httpVersion: request.httpVersion,
            url: request.url,
            query: null,
            controller: 'home',
            action: 'index',
            slug: null,

        };

        if (parts.length == 2) {
        pageData.query = {};
        let pairs = parts[1].split("&");
        for (let i = 0; i < pairs.length; i++) {
            let pair = pairs[i];
            let keyValue = pair.split("=");
            pageData.query[keyValue[0]] = keyValue[1];
        }
        let queryStr = "{\\n";
        for (let key in pageData.query) {
            queryStr += `&nbsp;&nbsp;${key}: ${pageData.query[key]},\\n`;
        }
        if (queryStr.includes(",")) {
            queryStr = queryStr.slice(0, -3);
        }
        queryStr += "\\n}";
        pageData.queryString = queryStr.replace(/\\n/g, "<br>");
        } else {
            pageData.query = {};
                pageData.queryString = "{}";
        }

        pageData.path = parts[0];

        let pathParts = pageData.path.split("/").filter(Boolean); 

        if (pathParts[0]) {
            pageData.controller = pathParts[0];
        }
        if (pathParts[1]) {
            pageData.action = pathParts[1];
        }
        if (pathParts[2]) {
            pageData.slug = pathParts[2];
        }

        if (parts.length > 2) {
            throw new Error("Format error");
        }

        pageData.groupsHtml = ""; // await this.makeGroupsHtml()

        response.writeHead(200, {
            'Content-Type': 'text/html'
        });

        const file = await fs.open("home.html", "r");
        let html = (await file.readFile()).toString();
        file.close();
        for(let k in pageData) {
            html = html.replaceAll(`{{${k}}}`, pageData[k]);
        }
        response.end(html);
    }

    privacy(request, response, id) {
        response.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
        });
        response.end(`<html><head><meta charset-utf-8/></head><body>
            <h1>Політика конфіденційності</h1>
        </body></html>`);
    }

    
    async makeGroupsHtml() {
        const [data] = await this.dbPool.query('SELECT * FROM \`groups\`')
        let wasChild
        do {
            wasChild = false
            for (let i = 0; i < data.length; i++) {
                let grp = data[i]
                if (grp["parent_id"] != null) {
                    wasChild = true
                    let parent = this.findParent(data, grp["parent_id"])
                    if (typeof parent.sub == 'undefined') {
                        parent.sub = []
                    }
                    parent.sub.push(grp)
                    data.splice(i, 1)
                }
            }
        } while (wasChild)
        
        return this.grpToHtml(data)
    }
    
    grpToHtml(grps) {
        let html = "<ul>"
        for (let grp of grps) {
            html += `<li>${grp.name}`
            if (typeof grp.sub != 'undefined' && grp.sub.length > 0) {
                html += this.grpToHtml(grp.sub)
            }
            html += '</li>'
        }
        html += '</ul>'
        return html
    }
    
    findParent(arr, parent_id) {
        for (let elem of arr) {
            if (elem.id == parent_id) return elem
            if (typeof elem.sub != 'undefined') {
                let p = this.findParent(elem.sub, parent_id)
                if (p != null) return p
            }
        }
        return null
    }
    
};
