var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    querystring = require('querystring'),
    open = require('open');

var port = process.argv[2] || 8888;
var serverUrl = 'http://localhost:' + port;

var CURRENT_DIRECTORY = process.cwd();
console.log('Starting server in:');
console.log('    ' + CURRENT_DIRECTORY);

http.createServer(function(request, response) {

    var uri = url.parse(request.url).pathname;
    var filename = path.join(CURRENT_DIRECTORY, decodeURIComponent(uri));
    if (uri === '/jquery-1.4.2.min.js') {
        // Hack to find the directory of our scripts.
        // TODO: use a function instead
        var lib_directory = process.mainModule.filename.substring(0,
                                                                  process.mainModule.filename.length - 'index.js'.length);
        filename = path.join(lib_directory, uri);
    }

    console.log(request.method + ' ' + request.url);

    var contentTypesByExtension = {
        '.html': "text/html",
        '.css': "text/css",
        '.js': "text/javascript"
    };

    var fileExistsOr404 = function(filenameThatShouldExist, successFunction) {

        fs.exists("" + filenameThatShouldExist, function(exists) {
            if (!exists) {
                console.log('-- 404 Not Found: ' + filenameThatShouldExist);
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 Not Found\n");
                response.end();
                return;
            }

            successFunction();
        });
    }

// Source for naturalSorter: http://stackoverflow.com/a/2802804/298195
    function naturalSorter(as, bs) {
        var a, b, a1, b1, i = 0, n, L,
            rx = /(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
        if (as === bs) return 0;
        a = as.toLowerCase().match(rx);
        b = bs.toLowerCase().match(rx);
        L = a.length;
        while (i < L) {
            if (!b[i]) return 1;
            a1 = a[i],
                b1 = b[i++];
            if (a1 !== b1) {
                n = a1 - b1;
                if (!isNaN(n)) return n;
                return a1 > b1 ? 1 : -1;
            }
        }
        return b[i] ? -1 : 0;
    }

    function getFileListForDirectory(dir, getFromSubdirectories) {
        var files = fs.readdirSync(dir);
        var filesAndDirectories = [];
        for (var i in files) {
            if (!files.hasOwnProperty(i)) continue;
            var name = dir + '/' + files[i];
            if (fs.statSync(name).isDirectory()) {
                filesAndDirectories.push(name);
                if (getFromSubdirectories) {
                    // TODO: getFileListForDirectory(name);
                }
            }
            else {
                filesAndDirectories.push(name);
            }
        }
        return filesAndDirectories;
    }

    function handlePost(endFunction) {

        // Based on http://stackoverflow.com/a/12022746/298195
        var queryData = "";
        request.on('data', function(data) {
            queryData += data;
            if (queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            response.post = querystring.parse(queryData);
            console.log(response.post);
            return endFunction();
        });
    }

    if (uri === '/') {
        var mainpage_html = '<!DOCTYPE html>' +
            '<html>' +
            '    <head>' +
            '    </head>' +
            '    <frameset framespacing="0" cols="150,*" frameborder="0" noresize>' +
            '        <frame name="top" src="/filelist" target="top">' +
            '        <frame name="main" src="/fileoverview_with_rename" target="main">' +
            '    </frameset>' +
            '</html>';
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(mainpage_html + "\n");
        response.end();
        return
    }

    else if (uri === '/fileoverview_with_rename') {
        var mainpage_html = '<!DOCTYPE html>' +
            '<html>' +
            '    <head>' +
            '    </head>' +
            '    <frameset framespacing="0" rows="50%,50%" frameborder="0" noresize>' +
            '        <frame name="overview" src="/fileoverview" target="categorieser">' +
            '        <frame name="categorieser" src="/filecategoriser">' +
            '    </frameset>' +
            '</html>';
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(mainpage_html + "\n");
        response.end();
        return
    }

    else if (uri === '/fileoverview') {
        var html = '<!DOCTYPE html>' +
            '<html>' +
            '    <head>' +
            '       <style>.selectedFile { border: 3px solid green; }' +
            '       </style>' +
            '    </head>';
        html += '<body style="background-color: lightgray;">';
        html += '<a data-link="/filecategoriser?" href="/filecategoriser" style="position: fixed; top: 10px; right: 10px;" class="renamefileslink" target="categorieser">Renames these files</a>';
        html += 'Directory: ' + CURRENT_DIRECTORY + '<br><br>';
        html += '<b>File list:</b><br>';
        var filesAndDirectories = getFileListForDirectory(CURRENT_DIRECTORY);
        filesAndDirectories.sort(naturalSorter);
        for (var i = 0; i < filesAndDirectories.length; i++) {
            var filename = filesAndDirectories[i].substring(CURRENT_DIRECTORY.length + 1);

            html += '<div style="padding: 1em; width: auto; height: auto; display: inline-block;" class="file" data-filename="' + filename + '">';
            if (fs.statSync(filesAndDirectories[i]).isDirectory()) {
                html += '<div style="height: 300px; width: 300px; display: inline-block; vertical-align: bottom;">' +
                    '<b>Directory:</b><br>' + filename +
                    '</div>';
            }
            else {
                html += filename + '<br>';
                html += '<img src="' + filename + '" style="width: 300px; height: 300px;">';
            }
            html += '</div>';
        }
        // TODO: upgrade jquery and use $(this).data('filename');
        html += '<script src="jquery-1.4.2.min.js"></script>';
        html += '<script>';
        html += 'function updateLink() { ' +
            'var new_link = $(\'.renamefileslink\').attr(\'data-link\');' +
            '$(\'.selectedFile\').each(function() { new_link += \'&files[]=\' + $(this).attr(\'data-filename\'); });' +
            'console.log(\'New link: \' + new_link);' +
            '$(\'.renamefileslink\').attr(\'href\', new_link);' +
            '}';
        html += '$(document).ready(function() {';
        html += '  $(\'.file\').click(function() { $(this).toggleClass(\'selectedFile\'); updateLink(); });';
        html += '});';
        html += '</script>';
        html += '</body>';
        '</html>';
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html + "\n");
        response.end();
    }

    else if (uri === '/filecategoriser') {
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        var files = query['files[]'] || [];
        console.log('-- FILES: ');
        console.log(files);

        if (request.method === 'POST') {
            handlePost(function() {

                var html = '<!DOCTYPE html>' +
                    '<html>' +
                    '    <body>';

                var categoryname_new = response.post.categoryname_new;
                categoryname_new = categoryname_new.replace(/\\/g, ''); // Remove slashes
                categoryname_new_with_path = path.join(CURRENT_DIRECTORY, categoryname_new);
                console.log('-- NEW FOLDER: ' + categoryname_new_with_path);
                fs.mkdirSync(categoryname_new_with_path);
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    filename_new_with_path = path.join(categoryname_new_with_path, file);
                    filename_old_with_path = path.join(CURRENT_DIRECTORY, file);
                    console.log('-- FILE: ' + file);
                    console.log('-- -- New - full path: ' + filename_new_with_path);
                    console.log('-- -- Old - full path: ' + filename_old_with_path);
                    fs.renameSync(filename_old_with_path, filename_new_with_path);
                    html += '      Ok - ' + file + '<br>';
                }
                html += '    </body>' +
                    '</html>';
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write(html + "\n");
                response.end();
                return
            });
        }
        else {
            var html = '<!DOCTYPE html>' +
                '<html>' +
                '    <head>' +
                '    </head>';
            html += '<form method="POST">';
            html += '<input name="categoryname_new" id="categoryname_new" style="width: 90%">';
            html += '<input id="categoryname_submit" style="width: 10%" value="Rename" type="submit" class="btn btn-large btn-primary"><br>';
            html += '</form>';
            for (var i = 0; i < files.length; i++) {
                html += '<img src="' + files[i] + '" style="width: 150px; height: 150px;">';
            }
            html += '<table><tr><td>';
            html += '<span id="categoryname_new_display"></span>';
            html += '</td><td>';
            for (var i = 0; i < files.length; i++) {
                html += files[i] + '<br>';
            }
            html += '</td></tr></table>';
            html += '<script>' +
                'var elm = document.getElementById("categoryname_new"); ' +
                'var elm2 = document.getElementById("categoryname_new_display"); ' +
                'var updateFunction = function() { console.log("New value: " + elm.value); elm2.innerHTML=elm.value; }; ' +
                'elm.onclick = updateFunction; ' +
                'elm.onkeyup = updateFunction; ' +
                'elm.onchange = updateFunction; ' +
                'updateFunction(); ' +
                '</script>';
            html += '</html>';
            response.writeHead(200, {"Content-Type": "text/html"});
            response.write(html + "\n");
            response.end();
            return
        }
    }

    else if (uri === '/fileview') {
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        console.log('-- FILE: ' + query.file);

        fileExistsOr404(query.file, function() {
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
        });
    }

    else if (uri === '/filerename') {
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        console.log('-- FILE: ' + query.file);
        fileExistsOr404(query.file, function() {

            if (request.method === 'POST') {
                handlePost(function() {
                    var filename_new = response.post.filename_new + path.extname(query.file);
                    filename_new = filename_new.replace(/\\/g, ''); // Remove slashes
                    filename_new_with_path = path.join(CURRENT_DIRECTORY, filename_new);
                    filename_old_with_path = path.join(CURRENT_DIRECTORY, query.file);
                    console.log('-- NEW FILENAME: ' + filename_new);
                    console.log('-- -- New - full path: ' + filename_new_with_path);
                    console.log('-- -- Old - full path: ' + filename_old_with_path);
                    fs.renameSync(filename_old_with_path, filename_new_with_path);
                    var html = '<!DOCTYPE html>' +
                        '<html>' +
                        '    <body>' +
                        '      Ok<br>' +
                        '      - Old: ' + filename_old_with_path + '<br>' +
                        '      - New: ' + filename_new_with_path + '<br>' +
                        '    </body>' +
                        '</html>';
                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.write(html + "\n");
                    response.end();
                    return
                });
            }
            else {

                var html = '<!DOCTYPE html>' +
                    '<html>' +
                    '    <head>' +
                    '    </head>';
                html += '<body style="background-color: lightgray;">';
                html += '<form method="POST">';
                html += '<input name="filename_new" id="filename_new" style="width: 90%">';
                html += '<input id="filename_submit" style="width: 10%" value="Rename" type="submit" class="btn btn-large btn-primary"><br>';
                html += '</form>';
                html += 'Previous name: ' + query.file + '<br>';
                html += 'New name: <span id="filename_new_display"></span>' + path.extname(query.file) + '<br>';
                html += '</body>';
                html += '<script>' +
                    'var elm = document.getElementById("filename_new"); ' +
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
        });
    }

    else if (uri === '/filelist') {

        var html = '<!DOCTYPE html>' +
            '<html>' +
            '    <head>' +
            '    </head>';
        html += '<body style="background-color: lightgray;">';
        html += 'Directory: ' + CURRENT_DIRECTORY + '<br><br>';
        html += '<b>File list:</b><br>';
        var filesAndDirectories = getFileListForDirectory(CURRENT_DIRECTORY);
        filesAndDirectories.sort(naturalSorter);
        for (var i = 0; i < filesAndDirectories.length; i++) {
            var filename = filesAndDirectories[i].substring(CURRENT_DIRECTORY.length + 1);
            html += '<span style="white-space:nowrap;">' +
                '- <a href="/fileview?file=' + filename + '" target="main">' + filename + '</a></span><br />';
        }
        html += '</body>';
        '</html>';
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html + "\n");
        response.end();
        return
    }

    else {

        fileExistsOr404(filename, function() {

            fs.readFile(filename, "binary", function(err, file) {
                if (err) {
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
    }
}).listen(parseInt(port, 10));

console.log("Web server running at\n  => " + serverUrl + "/\nCTRL + C to shutdown");
open(serverUrl);
