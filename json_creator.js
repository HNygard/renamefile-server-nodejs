$(function() {
	if (!document.location.search.includes('categorize')) {
		return;
	}
	$('#main_form').html('');
	$('body').css('background-color', 'white');

	var creator = $('#json_creator');
	var selected_year;
	var selected_month;
	var selected_day;
	var selected_invoice_year;
	var selected_invoice_month;
	var selected_invoice_day;
	var selected_amount;
	var selected_payment_type;
	var selected_transaction_id;
	var selected_accounting_subject;
	var selected_accounting_post;
	var comment;

	var accountTransactionPromise; 
	var sources;
	var selected_source;
	var accountTransaction;
	fetch('sources.json')
		.then(function(data) {
			return data.json();
		})
		.then(function(data) {
			sources = data.sources;
			reset();
		});
	function setSelectedSource() {
		for(var i = 0; i < sources.length; i++) {
			if (sources[i].folder === selected_accounting_subject) {
				selected_source = sources[i];
			}
		}
	}
	function htmlEncode(value){
		return $('<div/>').text(value).html();
	}
	function htmlStatusInner() {
		var status = '';
		if (selected_accounting_subject) {
			status += selected_accounting_subject + '/';
		}
		if (selected_year) {
			status += selected_year;
		}
		if (selected_month) {
			status += '-' + selected_month;
		}
		if (selected_day) {
			status += '-' + selected_day;
		}
		if (selected_invoice_year) {
			status += ' (' + selected_invoice_year;
		}
		if (selected_invoice_month) {
			status += '-' + selected_invoice_month;
		}
		if (selected_invoice_day) {
			status += '-' + selected_invoice_day + ')';
		}
		if (selected_accounting_post) {
			status += ' - ' + selected_accounting_post;
		}
		if (selected_amount) {
			status += ' - ' + selected_amount + ' kr';
		}
		if (selected_payment_type) {
			status += ' - ' + selected_payment_type;
		}
		if (comment) {
			status += ' - ' + comment;
		}

		if (!status) {
			status = 'no status';
		}

		var fontsize = '1em';
		if ('bf.no/2017-03-10 - 9000 - 556,90666555 kr'.length < status.length) {
			fontsize = '0.7em';
		}
		return '<div class="row"><div class="col-12 status-row" style="font-size: ' + fontsize + '">' + status + '</div></div>';
	}
	function htmlStatus() {
		return '<div class="container-fluid" id="status-wrapper">' + htmlStatusInner() + '</div>';
	}
	function htmlYears(selector) {
		var html_years = htmlStatus();
		var current_year = (new Date()).getYear() - 100 + 2000;
		for(var i = current_year; i > (current_year - 6); i--) {
			html_years += '<div class="col-6" style="padding-top: 5px; padding-bottom: 5px;">' +
				'<button value="' + (i) + '"' +
					' class="btn ' + (current_year === i ? 'btn-primary' : 'btn-default') + ' ' + selector + '"' +
					' style="width: 100%">' +
					(i) +
				'</button>' +
				'</div>';
		}
		return '<div class="container-fluid"><div class="row">' + html_years + '</div></div>';
	}
	function htmlMonths(selector) {
		var html_months = htmlStatus();
		for(var i = 1; i <= 12; i++) {
			html_months += '<div class="col-3" style="padding-top: 5px; padding-bottom: 5px;">' +
				'<button value="' + (i) + '"' +
					' class="btn btn-default ' + selector + '"' +
					' style="width: 100%">' +
					(i) +
				'</button>' +
				'</div>';
		}
		return '<div class="container-fluid"><div class="row">' + html_months + '</div></div>';
	}
	function htmlDays(selector) {
		var html_days = htmlStatus();
		var button = function(i) {
			return '<div style="padding-top: 5px; padding-bottom: 5px; flex: 0 0 9.090909091%;' +
					' max-width: 9.090909091%; position: relative; width: 100%; padding-left: 1px; padding-right: 1px;">' +
					'<button value="' + (i) + '"' +
						' class="btn btn-default ' + selector + '"' +
						' style="width: 100%;">' +
						'<span style="margin-left: -10px;">' + (i) + '</span>' +
					'</button>' +
				'</div>';
		}
		html_days += '<div class="row_one" style="display: flex; flex-wrap: wrap;">';
		for(var i = 1; i <= 11; i++) {
			html_days += button(i);
		}
		html_days += '</div><div class="row_two" style="display: flex; flex-wrap: wrap;">';
		for(var i = 12; i <= 22; i++) {
			html_days += button(i);
		}
		html_days += '</div><div class="row_three" style="display: flex; flex-wrap: wrap;">';
		for(var i = 23; i <= 31; i++) {
			html_days += button(i);
		}
		html_days += '</div>';
		return html_days;
	}
	function htmlAmount() {
		var html_amount = htmlStatus();
		var button = function(i, className) {
			return '<div class="col-3" style="padding-top: 5px; padding-bottom: 5px;">' +
				'<button value="' + (i) + '"' +
					' class="btn ' + (className ? className : 'btn-default amount_selector') + '"' +
					' style="width: 100%">' +
					(i) +
				'</button>' +
				'</div>';
		}
		html_amount += button(7);
		html_amount += button(8);
		html_amount += button(9);
		html_amount += button(0);

		html_amount += button(4);
		html_amount += button(5);
		html_amount += button(6);
		html_amount += button(',');

		html_amount += button(1);
		html_amount += button(2);
		html_amount += button(3);
		html_amount += button('&#x21fe;', 'btn-primary btn-amount-next');
		return '<div class="container-fluid"><div class="row">' + html_amount + '</div></div>';
	}
	function htmlAccountingSubject() {
		var html_accounting_subject = htmlStatus();
		for(var i = 0; i < sources.length; i++) {
			html_accounting_subject += '<div class="col-12" style="padding-top: 5px; padding-bottom: 5px;">' +
				'<button data-folder="' + sources[i].folder + '"' +
					' class="btn btn-default accounting_subject_selector"' +
					' style="width: 100%">' +
					(sources[i].name) +
				'</button>' +
				'</div>';
		}
		return '<div class="container-fluid"><div class="row">' + html_accounting_subject + '</div></div>';
	}
	function htmlPaymentType() {
		var html_payment_type = htmlStatus();
		var button = function(text, data_post) {
			return '<div class="col-12" style="padding-top: 5px; padding-bottom: 5px;">' +
				'<button data-payment-type="' + data_post + '"' +
					' class="btn btn-default payment_type"' +
					' style="width: 100%">' +
					text +
				'</button>' +
				'</div>';
		}
		html_payment_type += button('Cash', 'CASH');
		html_payment_type += button('Bank transfer', 'BANK_TRANSFER');
		html_payment_type += button('Bank invoice', 'INVOICE');
		html_payment_type += button('Card', 'CARD');
		return '<div class="container-fluid"><div class="row">' + html_payment_type + '</div></div>';
	}
	function htmlSelectTransaction() {
		var html_transactions = htmlStatus();
		var button = function(transaction, btn_class) {
			var labels = {};
			for (var j = 0; j < transaction.labels.length; j++) {
				labels[transaction.labels[j].label + '--' +
					 transaction.labels[j].label_type] = 
					'<span class="label" title="' + transaction.labels[j].label_type + '">' + transaction.labels[j].label + '</span>';
			}
			var labels2 = [];
			var labelKeys = Object.keys(labels);
			for(var b = 0; b < labelKeys.length; b++) {
				labels2.push(labels[labelKeys[b]]);
			}
			var a = new Date(parseInt(transaction.timestamp + '000'));
			var month = a.getMonth() + 1;
			if (month < 10) {
				month = '0' + month;
			}
			var day = a.getDate() + 1;
			if (day < 10) {
				day = '0' + day;
			}
			return '<div class="col-12" style="padding-top: 5px; padding-bottom: 5px;">' +
				'<button data-transaction-id="' + transaction.id + '"' +
					' class="btn ' + btn_class + ' account-transaction"' +
					' style="width: 100%">' +
					(a.getYear() - 100 + 2000) + '-' + month + '-' + day + ': ' +
					transaction.amount_debit + ' ' + transaction.currency_debit + '<br>' +
					labels2.join('<br>') +
				'</button>' +
				'</div>';
		}
		var amount = parseFloat(selected_amount.replace(',', '.'));
		var bankAccounts = Object.keys(accountTransaction);
		for(var i = 0; i < bankAccounts.length; i++) {
			for(var j = 0; j < accountTransaction[bankAccounts[i]].transactions.length; j++) {
				if (accountTransaction[bankAccounts[i]].transactions[j].amount_debit == amount) {
					html_transactions += button(accountTransaction[bankAccounts[i]].transactions[j], 'btn-primary');
				}
			}
		}
		var bankAccounts = Object.keys(accountTransaction);
		for(var i = 0; i < bankAccounts.length; i++) {
			for(var j = 0; j < accountTransaction[bankAccounts[i]].transactions.length; j++) {
				html_transactions += button(accountTransaction[bankAccounts[i]].transactions[j], 'btn-default');
			}
		}
		return '<div class="container-fluid"><div class="row">' + html_transactions + '</div></div>';

	}
	function htmlAccountingPost() {
		var html_accounting_post = htmlStatus();
		var button = function(text, data_post) {
			return '<div class="col-12" style="padding-top: 5px; padding-bottom: 5px;">' +
				'<button data-post="' + data_post + '"' +
					' class="btn btn-default accounting_post"' +
					' style="width: 100%">' +
					text +
				'</button>' +
				'</div>';
		}
		html_accounting_post += button('No accunting post', '', 'btn btn-dark accounting-post');
		for (var j = 0; j < selected_source.accounting_posts.length; j++) {
			html_accounting_post += button(
				selected_source.accounting_posts[j].account_number + ' - ' + (selected_source.accounting_posts[j].name),
				selected_source.accounting_posts[j].account_number,
				'btn btn-default accounting_post'
			);
		}
		return '<div class="container-fluid"><div class="row">' + html_accounting_post + '</div></div>';
	}
	function htmlComment() {
		var html_comment = htmlStatus();
		html_comment += '<div class="col-12" style="padding-top: 5px; padding-bottom: 5px;">' +
			'<input type="text" id="comment_input" style="width: 100%" value="' + htmlEncode(comment) + '">' +
			'</div>';
		html_comment += '<div class="col-12" style="padding-top: 5px; padding-bottom: 5px;">' +
			'<button ' +
				' class="btn btn-default comment-next"' +
				' style="width: 100%">Save data</button>' +
			'</div>';
		return '<div class="container-fluid"><div class="row">' + html_comment + '</div></div>';
	}
	function htmlFormSubmit() {
		var html_form_submit = htmlStatus();
                html_form_submit += '<form method="POST">';
                html_form_submit += '<input name="data_year" value="' + selected_year + '" style="width: 40%;">';
                html_form_submit += '<input name="data_month" value="' + selected_month + '" style="width: 30%;">';
                html_form_submit += '<input name="data_day" value="' + selected_day + '" style="width: 30%;"><br>';
                html_form_submit += '<input name="data_amount" value="' + selected_amount + '" style="width: 100%;"><br>';
                html_form_submit += '<input name="data_accounting_subject" value="' + selected_accounting_subject + '" style="width: 50%;">';
                html_form_submit += '<input name="data_accounting_post" value="' + selected_accounting_post + '" style="width: 50%;"><br>';
                html_form_submit += '<input name="data_comment" value="' + comment + '" style="width: 100%;"><br>';
                html_form_submit += '<input name="data_payment_type" value="' + selected_payment_type + '" style="width: 50%;">';
                html_form_submit += '<input name="data_transaction_id" value="' + selected_transaction_id + '" style="width: 50%;"><br>';
		if (selected_payment_type === 'INVOICE') {
		        html_form_submit += '<input name="data_invoice_date_year" value="' + selected_invoice_date_year + '" style="width: 40%;">';
		        html_form_submit += '<input name="data_invoice_date_month" value="' + selected_invoice_date_month + '" style="width: 30%;">';
		        html_form_submit += '<input name="data_invoice_date_day" value="' + selected_invoice_date_day + '" style="width: 30%;"><br>';
		}
                html_form_submit += '<input id="filename_submit" style="width: 100%" value="Rename" type="submit" class="btn btn-large btn-primary"><br>';
                html_form_submit += '</form>';;
		return '<div class="container-fluid"><div class="row">' + html_form_submit + '</div></div>';
	}
	function updateHtml(html) {
		creator.html(html);
		updateBindings();
	}

	// :: Flow
	//
	// [date]  =>  [amount]   =>  [accounting subject]
	//                                 ||
	//                                 \/
	//                            [payment type]
	//                                 ||
	//                                 \/
	//                        other <--||-->  invoice  =>  [due date]
	//                         ||      ||                   ||
	//                         ||      \/                   \/
	//                         ||     bank  => [select transaction]
	//                         ||                 ||
	//                         \/                 \/
	//                      [ ----- accounting post ----- ]
	//                                ||
	//                                \/
	//                      [ ----- comment ------------- ]

	function updateBindings() {
		$('.status-row', creator).click(reset);

		$('button.year_selector', creator).click(onclickYear);
		$('button.month_selector', creator).click(onclickMonth);
		$('button.day_selector', creator).click(onclickDay);

		$('button.amount_selector', creator).click(onclickAmount);
		$('button.btn-amount-next', creator).click(onclickAmountNext);

		$('button.accounting_subject_selector', creator).click(onclickAccountingSubject);

		$('button.payment_type', creator).click(onclickPaymentType);

		$('button.account-transaction', creator).click(onclickSelectTransaction);

		$('button.invoice_date_year_selector', creator).click(onclickInvoiceDueDateYear);
		$('button.invoice_date_month_selector', creator).click(onclickInvoiceDueDateMonth);
		$('button.invoice_date_day_selector', creator).click(onclickInvoiceDueDateDay);

		$('button.accounting_post', creator).click(onclickAccountingPost);

		$('#comment_input', creator).change(onchangeComment);
		$('#comment_input', creator).keypress(onchangeComment);
		$('button.comment-next', creator).click(onclickCommentNext);
	}

	// :: 1 - Find year
	function reset() {
		selected_year = '';
		selected_month = '';
		selected_day = '';
		selected_invoice_year = '';
		selected_invoice_month = '';
		selected_invoice_day = '';
		selected_amount = '';
		selected_payment_type = '';
		selected_transaction_id = '';
		selected_accounting_subject = '';
		selected_accounting_post = '';
		comment = '';

		var url = new URL(document.location.href);
		var filename_without_extension = url.searchParams.get("file")
			.replace('.JPG', '')
			.replace('.jpg', '')
			.replace('.PNG', '')
			.replace('.png', '')
			.replace('.PDF', '')
			.replace('.pdf', '');
		// Ignore thoses with only numbers
		if (isNaN(filename_without_extension)) {
			// -> Not a number, guessing some content is present in file name
			console.log('Reading from file name: ' + filename_without_extension);
			comment = filename_without_extension;
		}

		var regex_date = /^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9]) - /g;
		var match = regex_date.exec(comment);
		if (match) {
			// -> Starts with "2018-02-18 - "
			selected_year = match[1];
			selected_month = match[2];
			selected_day = match[3];
			console.log('- Found date: ' + selected_year + '-' + selected_month + '-' + selected_day);
			comment = comment.substr('2017-01-01 - '.length);
		}

		var regex_amount = /^([0-9\.,]*) kr (INN )?- /g;
		var match = regex_amount.exec(comment);
		if (match) {
			// -> Starts with "123,12 kr - "
			selected_amount = match[1];
			console.log('- Found amount: ' + selected_amount);
			comment = comment.substr(match[0].length);
		}

		if (selected_year && selected_month && selected_day) {
			// -> Already have a date
			if (selected_amount) {
				// -> Already amount
				updateHtml(htmlAccountingSubject());
			}
			else {
				updateHtml(htmlAmount());
			}
		}
		else {
			updateHtml(htmlYears('year_selector'));
		}
	}

	// :: 2 - Find month
	function onclickYear() {
		selected_year = $(this).text();
		updateHtml(htmlMonths('month_selector'));
	}
	// :: 3 - Find day
	function onclickMonth() {
		selected_month = $(this).text();
		if (selected_month < 10) {
			selected_month = '0' + selected_month;
		}
		updateHtml(htmlDays('day_selector'));
	}
	// :: 4 - Find amount
	function onclickDay() {
		selected_day = $(this).text();
		if (selected_day < 10) {
			selected_day = '0' + selected_day;
		}
		updateHtml(htmlAmount());
	}
	function onclickAmount() {
		selected_amount += $(this).text();
		updateHtml(htmlAmount());
	}
	// :: 5 - Accounting subject
	function onclickAmountNext() {
		updateHtml(htmlAccountingSubject());
	}
	// :: 6 - Payment type
	function onclickAccountingSubject() {
		selected_accounting_subject = $(this).data('folder');
		setSelectedSource();
		updateHtml(htmlPaymentType());
	}
	// :: 7 - Accounting post
	function onclickPaymentType() {
		selected_payment_type = $(this).data('payment-type');

		function startAccountTransactionPromise() {
			var selected_date_unixtime = (new Date(selected_year + '-' + selected_month + '-' + selected_day)).getTime() / 1000;
			var unixtime_from = selected_date_unixtime - (60 * 60 * 24 * 10);
			var unixtime_to = selected_date_unixtime + (60 * 60 * 24 * 10);
			accountTransactionPromise = fetch('/account_transactions_api/' + selected_source.accounts.join(',') + '/' + unixtime_from + '/' + unixtime_to);
		}

		if (selected_payment_type === 'INVOICE') {
			startAccountTransactionPromise();
			updateHtml(htmlYears('invoice_date_year_selector'));
		}
		else if (selected_payment_type === 'BANK_TRANSFER') {
			startAccountTransactionPromise();
			updateWithSelectTransaction();
		}
		else {
			updateHtml(htmlAccountingPost());
		}
	}
	// :: 7.1.1 - Invoice due date - year
	function onclickInvoiceDueDateYear() {
		selected_invoice_date_year = $(this).text();
		updateHtml(htmlMonths('invoice_date_month_selector'));
	}
	// :: 7.1.2 - Invoice due date - month
	function onclickInvoiceDueDateMonth() {
		selected_invoice_date_month = $(this).text();
		if (selected_invoice_date_month < 10) {
			selected_invoice_date_month = '0' + selected_invoice_date_month;
		}
		updateHtml(htmlDays('invoice_date_day_selector'));
	}
	// :: 7.1.3 - Invoice due date - day
	function onclickInvoiceDueDateDay() {
		selected_invoice_date_day = $(this).text();
		if (selected_invoice_date_day < 10) {
			selected_invoice_date_day = '0' + selected_invoice_date_day;
		}
		updateWithSelectTransaction();
	}
	// 7.2 - Select transaction (API)
	function updateWithSelectTransaction() {
		updateHtml('Loading transactions...');
		accountTransactionPromise
			.then(function(data) { console.log(data); return data.json(); })
			.then(function(data) {
				accountTransaction = data;
				updateHtml(htmlSelectTransaction());
			});
	}
	function onclickSelectTransaction() {
		selected_transaction_id = $(this).data('transaction-id');
		updateHtml(htmlAccountingPost());
	}
	// 8 - Comment
	function onclickAccountingPost() {
		selected_accounting_post = $(this).data('post');
		updateHtml(htmlComment());
	}
	function onchangeComment() {
		comment = $(this).val();
		$('#status-wrapper').html(htmlStatusInner());
	}
	// 9 - Submit form
	function onclickCommentNext() {
		comment = $('#comment_input').val();
		updateHtml(htmlFormSubmit());
	}
});
