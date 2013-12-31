var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;
 
var CURRENT_DIRECTORY = process.cwd();
console.log('Starting server in:');
console.log('    ' + CURRENT_DIRECTORY);

http.createServer(function(request, response) {
 
  var uri = url.parse(request.url).pathname;
  var filename = path.join(CURRENT_DIRECTORY, decodeURIComponent(uri));

  console.log(request.method + ' ' + request.url);
  
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
    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;
    console.log('-- FILE: ' + query.file);
    var html = '<!DOCTYPE html>' +
      '<html>' +
      '    <head>' +
      '    </head>' +
      '    <frameset framespacing="0" rows="*,150" frameborder="0" noresize>' +
      '        <frame name="top" src="' + query.file + '">' +
      '        <frame name="main" src="/filerename?file=' + query.file + '">' +
      '    </frameset>' +
      '</html>';
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(html + "\n");
    response.end();
    return
  }

  if(uri === '/filerename') {
    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;
    console.log('-- FILE: ' + query.file);
    var html = '<!DOCTYPE html>' +
      '<html>' +
      '    <head>' +
      '    </head>';
    html += '<body style="background-color: lightgray;">';
    html += '<input id="filename_new" style="width: 100%"><br>';
    html += 'Previous name: '+query.file+'<br>';
    html += 'New name: <span id="filename_new_display"></span>' + path.extname(query.file) + '<br>';
    html += '</body>';
    html += '<script>'+
'var elm = document.getElementById("filename_new"); '+
'var elm2 = document.getElementById("filename_new_display"); ' +
'var updateFunction = function() { console.log("New value: " + elm.value); elm2.innerHTML=elm.value; }; ' +
'elm.onclick = updateFunction; ' +
'elm.onkeyup = updateFunction; ' +
'elm.onchange = updateFunction; ' +
'updateFunction(); ' +
'</script>';
      '</html>';
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(html + "\n");
    response.end();
    return
  }

  if(uri === '/filelist') {
    function getFiles(dir, getFromSubdirectories) {
        var files = fs.readdirSync(dir);
        var filesAndDirectories = [];
        for(var i in files) {
            if (!files.hasOwnProperty(i)) continue;
            var name = dir+'/'+files[i];
            if (fs.statSync(name).isDirectory()) {
                filesAndDirectories.push(name);
                if(getFromSubdirectories) {
                   // TODO: getFiles(name);
                }
            }
            else {
                filesAndDirectories.push(name);
            }
        }
        return filesAndDirectories;
    }

    var html = '<!DOCTYPE html>' +
      '<html>' +
      '    <head>' +
      '    </head>';
    html += '<body style="background-color: lightgray;">';
    html += 'Directory: ' + CURRENT_DIRECTORY + '<br><br>';
    html += '<b>File list:</b><br>';
    var filesAndDirectories = getFiles(CURRENT_DIRECTORY);
    for(var i = 0; i < filesAndDirectories.length; i++) {
        var filename = filesAndDirectories[i].substring(CURRENT_DIRECTORY.length+1);
        html += '- <a href="/fileview?file='+filename+'" target="main">'+filename+'</a><br />';
    }
    html += '</body>';
      '</html>';
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(html + "\n");
    response.end();
    return
  }

  fs.exists(filename, function(exists) {
    if(!exists) {
      console.log('-- 404 Not Found: ' + filename);
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
