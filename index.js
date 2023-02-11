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

function getLocalFile(filename) {
    // Hack to find the directory of our scripts.
    var lib_directory = process.mainModule.filename.substring(0, process.mainModule.filename.length - 'index.js'.length);
    return path.join(lib_directory, filename);
}

http.createServer(function (request, response) {

    var uri = url.parse(request.url).pathname;
    console.log('# -- # ' + uri + ' # -- #');
    var filename = path.join(CURRENT_DIRECTORY, decodeURIComponent(uri));
    if (uri === '/jquery.min.js') {
        filename = getLocalFile('node_modules/jquery/dist/jquery.min.js');
    }
    if (uri === '/hammer.min.js') {
        filename = getLocalFile('node_modules/hammerjs/hammer.min.js');
    }
    if (uri === '/bootstrap.min.css') {
        filename = getLocalFile('node_modules/bootstrap/dist/css/bootstrap.min.css');
    }
    if (uri === '/bootstrap.min.css.map') {
        filename = getLocalFile('node_modules/bootstrap/dist/css/bootstrap.min.css.map');
    }
    if (uri === '/bootstrap.min.js') {
        filename = getLocalFile('node_modules/bootstrap/dist/js/bootstrap.min.js');
    }
    if (uri === '/bootstrap.min.js.map') {
        filename = getLocalFile('node_modules/bootstrap/dist/js/bootstrap.min.js.map');
    }
    if (uri === '/bootstrap3-typeahead.js') {
        filename = getLocalFile('node_modules/bootstrap-3-typeahead/bootstrap3-typeahead.js');
    }
    if (uri === '/json_creator.js') {
        filename = getLocalFile('json_creator.js');
    }
    if (uri === '/zoom.js') {
        filename = getLocalFile('zoom.js');
    }
    if (uri === '/sources.json') {
        filename = getLocalFile('sources.json');
    }

    console.log(request.method + ' ' + request.url);

    var contentTypesByExtension = {
        '.html': "text/html",
        '.css': "text/css",
        '.js': "text/javascript",
        '.json': "application/json",
        '.pdf': "application/pdf"
    };

    var fileExistsOr404 = function (filenameThatShouldExist, successFunction) {

        fs.exists("" + filenameThatShouldExist, function (exists) {
            if (!exists) {
                console.log('-- 404 Not Found: ' + filenameThatShouldExist);
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 Not Found\n");
                response.end();
                return;
            }

            successFunction();
        });
    };

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
        request.on('data', function (data) {
            queryData += data;
            if (queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            response.post = querystring.parse(queryData);
            console.log(response.post);
            return endFunction();
        });
    }

    if (uri === '/') {
        var url_parts4 = url.parse(request.url, true);
        var query4 = url_parts4.query;
        var fileview = query4['fileview'] || [];
        console.log('-- FILEVIEW: ');
        console.log(fileview);
        var filenextqueryPart = '';
        if (query4.categorize) {
            filenextqueryPart += '&amp;categorize=true';
        }

        var mainpage_html1 = '<!DOCTYPE html>' +
            '<html>' +
            '    <head>' +
            '        <meta charset="utf-8"/>' +
            '    </head>' +
            '    <frameset framespacing="0" cols="300,*" frameborder="0" noresize>' +
            '        <frame name="top" src="/filelist?fileview=' + fileview + filenextqueryPart + '" target="top">' +
            '        <frame name="main" src="/fileoverview_with_rename" target="main">' +
            '    </frameset>' +
            '</html>';
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(mainpage_html1 + "\n");
        response.end();
    }
    else if (uri === '/fileoverview_with_rename') {
        var mainpage_html2 = '<!DOCTYPE html>' +
            '<html>' +
            '    <head>' +
            '        <meta charset="utf-8"/>' +
            '    </head>' +
            '    <frameset framespacing="0" rows="50%,50%" frameborder="0" noresize>' +
            '        <frame name="overview" src="/fileoverview" target="categorieser">' +
            '        <frame name="categorieser" src="/filecategoriser">' +
            '    </frameset>' +
            '</html>';
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(mainpage_html2 + "\n");
        response.end();
    }
    else if (uri === '/fileoverview') {
        var htmlFileoverview = '<!DOCTYPE html>' +
            '<html>' +
            '    <head>' +
            '        <meta charset="utf-8"/>' +
            '       <style>.selectedFile { border: 3px solid green; }' +
            '       </style>' +
            '    </head>';
        htmlFileoverview += '<body style="background-color: lightgray;">';
        htmlFileoverview += '<a data-link="/filecategoriser?" href="/filecategoriser" style="position: fixed; top: 10px; right: 10px;" class="renamefileslink" target="categorieser">Renames these files</a>';
        htmlFileoverview += 'Directory: ' + CURRENT_DIRECTORY + '<br><br>';
        htmlFileoverview += '<b>File list:</b><br>';
        var filesAndDirectories = getFileListForDirectory(CURRENT_DIRECTORY);
        filesAndDirectories.sort(naturalSorter);
        for (var i = 0; i < filesAndDirectories.length; i++) {
            var currentFilename = filesAndDirectories[i].substring(CURRENT_DIRECTORY.length + 1);

            htmlFileoverview += '<div style="padding: 1em; width: auto; height: auto; display: inline-block;" class="file" data-filename="' + currentFilename + '">';
            if (fs.statSync(filesAndDirectories[i]).isDirectory()) {
                htmlFileoverview += '<div style="height: 300px; width: 300px; display: inline-block; vertical-align: bottom;">' +
                    '<b>Directory:</b><br>' + currentFilename +
                    '</div>';
            }
            else {
                htmlFileoverview += currentFilename + '<br>';
                htmlFileoverview += '<img src="' + encodeURIComponent(currentFilename) + '" style="width: 300px; height: 300px;">';
            }
            htmlFileoverview += '</div>';
        }
        htmlFileoverview += '<script src="jquery.min.js"></script>';
        htmlFileoverview += '<script>';
        htmlFileoverview += 'function updateLink() { ' +
            'var new_link = $(\'.renamefileslink\').attr(\'data-link\');' +
            '$(\'.selectedFile\').each(function() { new_link += \'&files[]=\' + $(this).attr(\'data-filename\'); });' +
            'console.log(\'New link: \' + new_link);' +
            '$(\'.renamefileslink\').attr(\'href\', new_link);' +
            '}';
        htmlFileoverview += '$(document).ready(function() {';
        htmlFileoverview += '  $(\'.file\').click(function() { $(this).toggleClass(\'selectedFile\'); updateLink(); });';
        htmlFileoverview += '});';
        htmlFileoverview += '</script>';
        htmlFileoverview += '</body>';
        htmlFileoverview += '</html>';
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(htmlFileoverview + "\n");
        response.end();
    }
    else if (uri === '/filecategoriser') {
        var url_parts1 = url.parse(request.url, true);
        var query1 = url_parts1.query;
        var files = query1['files[]'] || [];
        console.log('-- FILES: ');
        console.log(files);

        if (request.method === 'POST') {
            handlePost(function () {

                var htmlFilecategorizerAfter = '<!DOCTYPE html>' +
                    '<html>' +
                    '    <body>';

                var categoryname_new = response.post.categoryname_new;
                categoryname_new = categoryname_new.replace(/\\/g, ''); // Remove slashes
                var categoryname_new_with_path = path.join(CURRENT_DIRECTORY, categoryname_new);
                console.log('-- NEW FOLDER: ' + categoryname_new_with_path);
                fs.mkdirSync(categoryname_new_with_path);
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    var filename_new_with_path = path.join(categoryname_new_with_path, file);
                    var filename_old_with_path = path.join(CURRENT_DIRECTORY, file);
                    console.log('-- FILE: ' + file);
                    console.log('-- -- New - full path: ' + filename_new_with_path);
                    console.log('-- -- Old - full path: ' + filename_old_with_path);
                    fs.renameSync(filename_old_with_path, filename_new_with_path);
                    htmlFilecategorizerAfter += '      Ok - ' + file + '<br>';
                }
                htmlFilecategorizerAfter += '    </body>' +
                    '</html>';
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write(htmlFilecategorizerAfter + "\n");
                response.end();
                return
            });
        }
        else {
            var htmlFilecategorizer = '<!DOCTYPE html>' +
                '<html>' +
                '    <head>' +
                '        <meta charset="utf-8"/>' +
                '    </head>';
            htmlFilecategorizer += '<form method="POST">';
            htmlFilecategorizer += '<input name="categoryname_new" id="categoryname_new" style="width: 90%">';
            htmlFilecategorizer += '<input id="categoryname_submit" style="width: 10%" value="Rename" type="submit" class="btn btn-large btn-primary"><br>';
            htmlFilecategorizer += '</form>';
            for (var i = 0; i < files.length; i++) {
                htmlFilecategorizer += '<a href="/fileviewimg?file=' + encodeURIComponent(files[i]) + '" target="overview">';
                htmlFilecategorizer += '<img src="' + encodeURIComponent(files[i]) + '" style="width: 150px; height: 150px;">';
                htmlFilecategorizer += '</a>';
            }
            htmlFilecategorizer += '<table><tr><td>';
            htmlFilecategorizer += '<span id="categoryname_new_display"></span>';
            htmlFilecategorizer += '</td><td>';
            for (var i = 0; i < files.length; i++) {
                htmlFilecategorizer += files[i] + '<br>';
            }
            htmlFilecategorizer += '</td></tr></table>';
            htmlFilecategorizer += '<script>' +
                'var elm = document.getElementById("categoryname_new"); ' +
                'var elm2 = document.getElementById("categoryname_new_display"); ' +
                'var updateFunction = function() { console.log("New value: " + elm.value); elm2.innerHTML=elm.value; }; ' +
                'elm.onclick = updateFunction; ' +
                'elm.onkeyup = updateFunction; ' +
                'elm.onchange = updateFunction; ' +
                'updateFunction(); ' +
                '</script>';
            htmlFilecategorizer += '</html>';
            response.writeHead(200, {"Content-Type": "text/html"});
            response.write(htmlFilecategorizer + "\n");
            response.end();
        }
    }
    else if (uri === '/fileview') {
        var url_parts2 = url.parse(request.url, true);
        var query2 = url_parts2.query;
        console.log('-- FILE: ' + query2.file);
        console.log('-- FILE NEXT: ' + query2.filenext);
        var filenextqueryPart = '';
        if (query2.filenext) {
            filenextqueryPart += '&amp;filenext=' + query2.filenext;
        }
        if (query2.categorize) {
            filenextqueryPart += '&amp;categorize=true';
        }

        fileExistsOr404(query2.file, function () {
            var fileviewimg = '/fileviewimg?file=' + query2.file + filenextqueryPart;
            if (query2.file.endsWith('.PDF') || query2.file.endsWith('.pdf') || query2.file.endsWith('.json') || query2.file.endsWith('.txt')) {
                // -> A PDF. Lets use Chrome PDF viewer.
                fileviewimg = query2.file;
            }
            var html = '<!DOCTYPE html>' +
                '<html>' +
                '    <head>' +
                '        <meta charset="utf-8"/>' +
                '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">' +
                '    </head>' +
                '    <frameset framespacing="0" rows="*,174" frameborder="0" noresize>' +
                '        <frame name="viewimg" src="' + fileviewimg + '">' +
                '        <frame name="rename" src="/filerename?file=' + query2.file + filenextqueryPart + '">' +
                '    </frameset>' +
                '</html>';
            response.writeHead(200, {"Content-Type": "text/html"});
            response.write(html + "\n");
            response.end();
        });
    }
    else if (uri === '/fileviewimg') {
        var url_parts3 = url.parse(request.url, true);
        var query3 = url_parts3.query;
        console.log('-- FILE: ' + query3.file);
        console.log('-- NEXT FILE: ' + query3.filenext);
        fileExistsOr404(query3.file, function () {
            var htmlFilerename = '<!DOCTYPE html>' +
                '<html>' +
                '    <head>' +
                '        <meta charset="utf-8"/>' +
                '        <script src="hammer.min.js"></script>' +
                '    </head>';
            htmlFilerename += '<body style="background-color: lightgray;">';

            htmlFilerename += '<a href="/" style="width: 10%; position: fixed; top: 0; left: 0;border: 1px solid red;opacity: 0.6;" target="_top">MAIN PAGE</a>';
            htmlFilerename += '<a href="/?categorize=true" style="width: 10%; position: fixed; top: 0; left: 10%;border: 1px solid red;opacity: 0.6;" target="_top">CATEGORIZER</a>';

            htmlFilerename += '<script>' +
                'function setImageOrPdfOrText(filename) {' +
                '    console.log("Opening [" + filename + "]");' +
                '    if (filename.endsWith(".pdf") || filename.endsWith(".PDF") || filename.endsWith(".json") || filename.endsWith(".txt")) {' +
                '    ' +
                '        document.getElementById(\'pinch-zoom-image-id\').src = "";' +
                '        document.getElementById(\'pinch-zoom-image-id\').style.display = "none";' +
                '        document.getElementById(\'directory_fileviewer\').src = filename;' +
                '        document.getElementById(\'directory_fileviewer\').style.display = "block";' +
                '    }' +
                '    else {' +
                '        document.getElementById(\'pinch-zoom-image-id\').src = filename;' +
                '        document.getElementById(\'pinch-zoom-image-id\').style.display = "block";' +
                '        document.getElementById(\'directory_fileviewer\').src = "";' +
                '        document.getElementById(\'directory_fileviewer\').style.display = "none";' +
                '    }' +
                '}' +
                '</script>';
            var file_to_view = query3.file;
            if (fs.lstatSync(query3.file).isDirectory()) {
                var dir_to_view = getFileListForDirectory(query3.file);
                for (var file_num = 0; file_num < dir_to_view.length; file_num++) {
                    if (file_to_view === query3.file) {
                        file_to_view = dir_to_view[file_num];
                    }
                    htmlFilerename += '<div style="background-color: gray; color: white; padding: 15px; margin-right: 15px; display: inline-block;"' +
                        ' onclick="setImageOrPdfOrText(\'' + dir_to_view[file_num] + '\');"' +
                        '>' + dir_to_view[file_num].replace(query3.file + '/', '') + '</div>';
                }
            }
            htmlFilerename += '<div class="pinch-zoom-container"><img id="pinch-zoom-image-id" style="width: 100%"  class="pinch-zoom-image" onload="onLoad()"></div>';
            htmlFilerename += '<iframe style="width: 100%; min-height: 700px" id="directory_fileviewer"></iframe><br>';
            //htmlFilerename += '<img src="' + query3.file + '" style="width: 100%" id="main_image"><br>';
            if (query3.filenext) {
                htmlFilerename += '<img src="' + query3.filenext + '" style="width: 20%; position: fixed; top: 0; right: 0;border: 1px solid red;opacity: 0.6;"><br>';
            }
            htmlFilerename += '</body>';
            htmlFilerename += '<script src="zoom.js"></script>';
            htmlFilerename += '<script>' +
                'var myElement = document.getElementById("main_image");' +
                'var mc = new Hammer.Manager(myElement);' +
                'mc.add( new Hammer.Tap({ event: "doubletap", taps: 2 }) );' +
                'mc.on("doubletap", function(ev) {' +
                '    console.log(ev.type);' +
                '});' +
                '' +
                '</script>';
            htmlFilerename += '<script>' +
                'setImageOrPdfOrText("' + file_to_view + '");' +
                '</script>';
            htmlFilerename += '</html>';
            response.writeHead(200, {"Content-Type": "text/html"});
            response.write(htmlFilerename + "\n");
            response.end();
        });
    }
    else if (uri === '/filerename') {
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        console.log('-- FILE: ' + query.file);
        console.log('-- NEXT FILE: ' + query.filenext);
        fileExistsOr404(query.file, function () {

            if (request.method === 'POST') {
                handlePost(function () {
                    var filename_new;
                    var directory_name_new;
                    if (response.post.data_year) {
                        // -> Mobile categorizer
                        // Folders
                        // <accounting subject>/<year>/<year>-<month>-<day> - <post> - <amount> kr - <comment>
                        var subject_folder = path.join(CURRENT_DIRECTORY, response.post.data_accounting_subject);
                        if (!fs.existsSync(subject_folder)) {
                            fs.mkdirSync(subject_folder);
                        }
                        var year_folder = path.join(CURRENT_DIRECTORY, response.post.data_accounting_subject + '/' + response.post.data_year);
                        if (!fs.existsSync(year_folder)) {
                            fs.mkdirSync(year_folder);
                        }

                        var currency = 'NOK';
                        var currencyDisplay = 'kr';
                        var the_filename = response.post.data_year + '-' + response.post.data_month + '-' + response.post.data_day +
                            ' - ' + response.post.data_accounting_post +
                            ' - ' + response.post.data_amount + ' ' + currencyDisplay +
                            (response.post.data_comment ? (' - ' + response.post.data_comment) : '');
                        filename_new = response.post.data_accounting_subject +
                            '/' + response.post.data_year +
                            '/' + the_filename;
                        var doc_folder = path.join(CURRENT_DIRECTORY, filename_new);
                        if (!fs.existsSync(doc_folder)) {
                            fs.mkdirSync(doc_folder);
                        }
                        directory_name_new = doc_folder;
                        filename_new = filename_new + '/' + the_filename;

                        var jsonObj = {};
                        jsonObj.date = response.post.data_year + '-' + response.post.data_month + '-' + response.post.data_day;
                        jsonObj.accounting_subject = response.post.data_accounting_subject;
                        if (response.post.data_accounting_post) {
                            jsonObj.accounting_post = response.post.data_accounting_post;
                        }
                        if (response.post.data_payment_type) {
                            jsonObj.payment_type = response.post.data_payment_type;
                        }
                        if (response.post.data_transaction_id) {
                            jsonObj.account_transaction_id = response.post.data_transaction_id;
                        }
                        if (response.post.data_invoice_date_year) {
                            jsonObj.invoice_date = response.post.data_invoice_date_year + '-' + response.post.data_invoice_date_month + '-' + response.post.data_invoice_date_day;
                        }
                        jsonObj.amount = response.post.data_amount;
                        jsonObj.currency = currency;
                        jsonObj.comment = response.post.data_comment;
                        jsonObj.transactions = [];

                        if (response.post['amount[]']
                            && response.post['amount[]'] instanceof Array
                            && response.post['amount[]'].length > 0) {
                            // -> Amount split in progress. Multiple items
                            for (var k = 0; k < response.post['amount[]'].length; k++) {
                                var objTransaction = {
                                    "amount": response.post['amount[]'][k],
                                    "currency": currency,
                                    "amount_includes_vat": (response.post['amount_includes_vat[]'][k] === 'true'),
                                    "vat_rate": response.post['vat_rate[]'][k],
//					"foreign_service_with_reversed_vat": true,
                                    "comment": response.post['comment[]'][k],
                                    "accounting_subject": response.post['accounting_subject[]'][k],
                                    "accounting_post": response.post['accounting_post[]'][k]
                                };
                                jsonObj.transactions.push(objTransaction);
                            }
                        }
                        else if (response.post['amount[]']
                            && response.post['amount[]'].length > 0) {
                            // -> Amount split in progress. 1 item
                            var objTransaction = {
                                "amount": response.post['amount[]'],
                                "currency": currency,
                                "amount_includes_vat": (response.post['amount_includes_vat[]'] === 'true'),
                                "vat_rate": response.post['vat_rate[]'],
//					"foreign_service_with_reversed_vat": true,
                                "comment": response.post['comment[]'],
                                "accounting_subject": response.post['accounting_subject[]'],
                                "accounting_post": response.post['accounting_post[]']
                            };
                            jsonObj.transactions.push(objTransaction);
                        }
                        else {
                            // -> No split. Create a transaction
                            var objTransaction = {
                                "amount": response.post.data_amount,
                                "currency": currency,
                                "comment": response.post.data_comment,
                                "accounting_subject": response.post.data_accounting_subject
                            };
                            if (response.post.data_accounting_post) {
                                objTransaction.accounting_post = response.post.data_accounting_post;
                            }
                            jsonObj.transactions.push(objTransaction);
                        }

                        var json_file = path.join(CURRENT_DIRECTORY, filename_new + '.json');
                        var jsonString = JSON.stringify(jsonObj, null, 4);
                        console.log('-- Writing to JSON file [' + json_file + '].');
                        console.log(jsonString);
                        fs.writeFileSync(json_file, jsonString);
                    }
                    else {
                        filename_new = response.post.filename_new;
                        directory_name_new = path.join(CURRENT_DIRECTORY, filename_new.replace(/\\/g, ''));
                    }
                    filename_new = filename_new + path.extname(query.file);
                    filename_new = filename_new.replace(/\\/g, ''); // Remove slashes
                    var filename_new_with_path = path.join(CURRENT_DIRECTORY, filename_new);
                    var filename_old_with_path = path.join(CURRENT_DIRECTORY, query.file);
                    console.log('-- NEW FILENAME: ' + filename_new);
                    console.log('-- -- New - full path: ' + filename_new_with_path);
                    console.log('-- -- Old - full path: ' + filename_old_with_path);
                    if (fs.lstatSync(filename_old_with_path).isDirectory()) {
                        if (!fs.existsSync(directory_name_new)) {
                            fs.mkdirSync(directory_name_new);
                        }
                        var files_in_dir = getFileListForDirectory(filename_old_with_path);
                        for (var file_num = 0; file_num < files_in_dir.length; file_num++) {
                            fs.renameSync(files_in_dir[file_num], directory_name_new + '/' + path.basename(files_in_dir[file_num]));
                        }
                        fs.rmdirSync(filename_old_with_path);
                    }
                    else {
                        fs.renameSync(filename_old_with_path, filename_new_with_path);
                    }
                    var html = '<!DOCTYPE html>' +
                        '<html>' +
                        '    <body>' +
                        '      Ok<br>' +
                        '      - Old: ' + filename_old_with_path + '<br>' +
                        '      - New: ' + filename_new_with_path + '<br>';
                    if (query.filenext) {
                        html += '    <script>top.location.href="/?fileview=' + query.filenext + (query.categorize ? '&categorize=true' : '') + '"</script>';
                    }
                    html += '    </body>';
                    '</html>';
                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.write(html + "\n");
                    response.end();
                });
            }
            else {

                var htmlFilerename = '<!DOCTYPE html>' +
                    '<html>' +
                    '    <head>' +
                    '        <meta charset="utf-8"/>' +
                    '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">' +
                    '<script src="jquery.min.js"></script>' +
                    '<script src="json_creator.js"></script>' +
                    '<script src="bootstrap.min.js"></script>' +
                    '<script src="bootstrap3-typeahead.js"></script>' +
                    '<link href="bootstrap.min.css" rel="stylesheet">' +
                    '<style>' +
                    // The typeahead does not seem to work. Not showing active item.
                    '.typeahead.dropdown-menu li:hover .dropdown-item, .typeahead.dropdown-menu li:focus .dropdown-item {' +
                    '  color: #16181b;' +
                    '  text-decoration: none;' +
                    '  background-color: #f8f9fa;' +
                    '}' +
                    '' +
                    '.typeahead.dropdown-menu li.active .dropdown-item, .typeahead.dropdown-menu li:active .dropdown-item {' +
                    '  color: #fff;' +
                    '  text-decoration: none;' +
                    '  background-color: #007bff;' +
                    '}' +
                    '' +
                    '.typeahead.dropdown-menu li.disabled .dropdown-item, .typeahead.dropdown-menu li:disabled .dropdown-item {' +
                    '  color: #6c757d;' +
                    '  background-color: transparent;' +
                    '}' +
                    '    </style>' +
                    '    </head>';
                htmlFilerename += '<body style="background-color: lightgray;">';
                htmlFilerename += '<div id="main_form">';
                htmlFilerename += '<form method="POST">';
                htmlFilerename += '<input name="filename_new" id="filename_new" style="width: 90%" autofocus>';
                htmlFilerename += '<input id="filename_submit" style="width: 10%" value="Rename" type="submit" class="btn btn-large btn-primary"><br>';
                htmlFilerename += '</form>';
                htmlFilerename += 'Previous name: <span id="filename_old_display" ' +
                    'onclick="document.getElementById(\'filename_new\').value=\'' + path.basename(query.file, path.extname(query.file)) + '\';">' + query.file + '</span><br>';
                htmlFilerename += 'New name: <span id="filename_new_display"></span>' + path.extname(query.file) + '<br>';
                htmlFilerename += '</div>';
                htmlFilerename += '<div id="json_creator"></div>';
                htmlFilerename += '</body>';
                htmlFilerename += '<script>' +
                    'var elm = document.getElementById("filename_new"); ' +
                    'var elm2 = document.getElementById("filename_new_display"); ' +
                    'var updateFunction = function() { console.log("New value: " + elm.value); elm2.innerHTML=elm.value; }; ' +
                    'elm.onclick = updateFunction; ' +
                    'elm.onkeyup = updateFunction; ' +
                    'elm.onchange = updateFunction; ' +
                    'updateFunction(); ' +
                    '</script>';

                if (fs.lstatSync(query.file).isDirectory()) {
                    console.log('Query is directory: ' + query.file);
                    var dir_to_view = getFileListForDirectory(query.file);
                    for (var file_num = 0; file_num < dir_to_view.length; file_num++) {
                        console.log('...: ' + dir_to_view[file_num]);
                        if (dir_to_view[file_num].endsWith('extracted_items.json')) {
                            htmlFilerename += '<script>' +
                                'initJsonCreatorItems("' + dir_to_view[file_num] + '");' +
                                '</script>';
                        }
                    }
                }

                htmlFilerename += '</html>';
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write(htmlFilerename + "\n");
                response.end();
            }
        });
    }
    else if (uri === '/filelist') {

        var url_parts5 = url.parse(request.url, true);
        var query5 = url_parts5.query;
        var fileview2 = query5['fileview'] || [];
        console.log('-- FILEVIEW: ');
        console.log(fileview2);
        var htmlFilelist = '<!DOCTYPE html>' +
            '<html>' +
            '    <head>' +
            '        <meta charset="utf-8"/>' +
            '    </head>';
        htmlFilelist += '<body style="background-color: lightgray;">';
        htmlFilelist += '<style>.clicked { color: white; background-color: red; }</style>';
        htmlFilelist += 'Directory: <a href="/" target="_top">' + CURRENT_DIRECTORY + '</a><br><br>';
        htmlFilelist += '<a href="/?categorize=true" target="_top">Categorizer</a><br><br>';
        htmlFilelist += '<b>File list:</b><br>';
        var filesAndDirs = getFileListForDirectory(CURRENT_DIRECTORY);
        filesAndDirs.sort(naturalSorter);
        for (var l = 0; l < filesAndDirs.length; l++) {
            var filenameForLink = filesAndDirs[l].substring(CURRENT_DIRECTORY.length + 1);
            var autoclick = '';
            if (fileview2 === filenameForLink) {
                autoclick = ' id="autoclick"';
            }
            var filenextQuery = '';
            if (filesAndDirs[l + 1]) {
                filenextQuery += '&amp;filenext=' + filesAndDirs[l + 1].substring(CURRENT_DIRECTORY.length + 1);
            }
            var target = 'main';
            if (query5.categorize) {
                target = '_top';
                filenextQuery += '&amp;categorize=true';
            }
            htmlFilelist += '<span style="white-space:nowrap;">' +
                '- <a href="/fileview?file=' + filenameForLink + filenextQuery + '" target="' + target + '"' + autoclick + ' onClick="this.className=\'clicked\'">' + filenameForLink + '</a></span><br />';
        }
        if (fileview2) {
            htmlFilelist += '<script>document.getElementById("autoclick").click();</script>'
        }
        htmlFilelist += '</body>';
        htmlFilelist += '</html>';
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(htmlFilelist + "\n");
        response.end();
    }
    else if (uri.startsWith('/account_transactions_api/')) {
        // -> Proxy the request.
        http.get('http://localhost:13080' + uri, res => {
            res.setEncoding("utf8");
            let body = "";
            res.on("data", data => {
                body += data;
            });
            res.on("end", () => {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.write(body);
                response.end();
            });
        });
    }
    else {
        fileExistsOr404(filename, function () {
            fs.readFile(filename, "binary", function (err, file) {
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
                var extension = path.extname(filename);
                var contentType = contentTypesByExtension[extension];
                if (contentType) {
                    headers["Content-Type"] = contentType;
                }
                if (extension.toLowerCase() === '.pdf') {
                    headers['Content-Disposition'] = 'inline; filename="not-for-saving.pdf"';
                }
                response.writeHead(200, headers);
                response.write(file, "binary");
                response.end();
            });
        });
    }
}).listen(parseInt(port, 10));

console.log("Web server running at\n  => " + serverUrl + "/\nCTRL + C to shutdown");
//open(serverUrl);
