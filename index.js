var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;
 
http.createServer(function(request, response) {
 
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

  console.log(request.method + ' ' + uri);
  
  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript"
  };

  if(uri === '/') {
    var mainpage_html = '<!DOCTYPE html>' +
      '<html>' +
      '    <head>' +
      '    </head>' +
      '    <frameset framespacing="0" cols="150,*" frameborder="0" noresize>' +
      '        <frame name="top" src="/filelist" target="top">' +
      '        <frame name="main" src="/fileview" target="main">' +
      '    </frameset>' +
      '</html>';
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(mainpage_html + "\n");
    response.end();
    return
  }

  if(uri === '/fileview') {
    var html = '<!DOCTYPE html>' +
      '<html>' +
      '    <head>' +
      '    </head>' +
      '    <frameset framespacing="0" rows="*,150" frameborder="0" noresize>' +
      '        <frame name="top" src="/file" target="top">' +
      '        <frame name="main" src="/filerename" target="main">' +
      '    </frameset>' +
      '</html>';
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(html + "\n");
    response.end();
    return
  }

  if(uri === '/filerename') {
    var html = '<!DOCTYPE html>' +
      '<html>' +
      '    <head>' +
      '    </head>';
    html += '<body style="background-color: lightgray;">';
    html += '<input style="width: 100%"><br>';
    html += 'Previous name: TODO<br>';
    html += 'New name: TODO<br>';
    html += '</body>';
      '</html>';
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(html + "\n");
    response.end();
    return
  }

  if(uri === '/filelist') {
    var html = '<!DOCTYPE html>' +
      '<html>' +
      '    <head>' +
      '    </head>';
    html += '<body style="background-color: lightgray;">';
    html += '<b>File list:</b><br>';
    html += 'TODO';
    html += '</body>';
      '</html>';
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(html + "\n");
    response.end();
    return
  }
  fs.exists(filename, function(exists) {
    if(!exists) {
      console.log('-- 404 Not Found');
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }
 
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        console.log('-- 500');
        console.log('-- Message: ' + err);
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }
 
      console.log('-- Sending file: ' + filename);
      var headers = {};
      var contentType = contentTypesByExtension[path.extname(filename)];
      if (contentType) headers["Content-Type"] = contentType;
      response.writeHead(200, headers);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(port, 10));
 
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
