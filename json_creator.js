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
	var selected_split_items;
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
		var button = function(text, data_post, btn_class) {
			return '<div class="col-12" style="padding-top: 5px; padding-bottom: 5px;">' +
				'<button data-post="' + data_post + '"' +
					' class="' + btn_class + '"' +
					' style="width: 100%">' +
					text +
				'</button>' +
				'</div>';
		}
		html_accounting_post += button('No accounting post', '', 'btn btn-dark accounting_post');
		html_accounting_post += button('Split amount', 'SPLIT', 'btn btn-dark accounting_post_split');
		for (var j = 0; j < selected_source.accounting_posts.length; j++) {
			html_accounting_post += button(
				selected_source.accounting_posts[j].account_number + ' - ' + (selected_source.accounting_posts[j].name),
				selected_source.accounting_posts[j].account_number,
				'btn btn-default accounting_post'
			);
		}
		return '<div class="container-fluid"><div class="row">' + html_accounting_post + '</div></div>';
	}
	function htmlAccountPostSplit() {
		var html_accounting_post = htmlStatus();
		var button = function(text, data_post, btn_class) {
			return '<div class="col-1" style="padding-top: 5px; padding-bottom: 5px;">' +
				'<button data-post="' + data_post + '"' +
					' class="' + btn_class + '"' +
					' style="width: 100%">' +
					text +
				'</button>' +
				'</div>';
		}
		html_accounting_post += '<div id="accounting_post_split_items" class="col-12"></div>';
		html_accounting_post += button('+', '', 'btn btn-primary accounting_post_split_add_item');
		html_accounting_post += '<div class="col-10" style=" text-align: right;">';
		html_accounting_post += 'Eks MVA: <span id="accounting_post_split_ex_vat" style="font-weight: bold;"></span>';
		html_accounting_post += ', MVA: <span id="accounting_post_split_vat" style="font-weight: bold;"></span>';
		html_accounting_post += ', ink MVA: <span id="accounting_post_split_inc_vat" style="font-weight: bold;"></span></div>';
		html_accounting_post += button('Next', '', 'btn btn-primary accounting_post_split_finish');
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
		if (selected_split_items) {
			for (var i = 0; i < selected_split_items.length; i++) {
				html_form_submit += i + ' -- ';
				html_form_submit += '<input name="amount[]" value="' + selected_split_items[i].amount + '" style="10%">';
				html_form_submit += '<input name="amount_includes_vat[]" value="' + (selected_split_items[i].amount_includes_vat ? 'true' : 'false') + '" style="10%">';
				html_form_submit += '<input name="vat_rate[]" value="' + selected_split_items[i].vat_rate + '" style="10%">';
				html_form_submit += '<input name="accounting_post[]" value="' + selected_split_items[i].accounting_post + '" style="10%">';
				html_form_submit += '<input name="accounting_subject[]" value="' + selected_split_items[i].accounting_subject + '" style="20%">';
				html_form_submit += '<input name="comment[]" value="' + selected_split_items[i].comment + '" style="30%">';
				html_form_submit += '<br>';
			}
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
	//                                ||-->  SPLIT => loop: [amount+comment+MVA]
	//                                \/                          ||
	//                      [ ----- comment ------------- ]     <=/

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
		$('button.accounting_post_split', creator).click(onclickAccountingPostSplit);
		$('button.accounting_post_split_add_item', creator).click(onclickAccountingPostSplitAddItem);
		$('button.accounting_post_split_finish', creator).click(onclickAccountingPostSplitNext);

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
	function onclickAccountingPostSplit() {
		// -> Go into split mode
		updateHtml(htmlAccountPostSplit());
		onclickAccountingPostSplitAddItem();
	}
	// 8 - Optional accounting post split
	function onclickAccountingPostSplitAddItem() {
		var randomId = '' + (new Date()).getTime() + parseInt(1000 * Math.random());
		$('#accounting_post_split_items').append(
			'<div class="col-12 split-items" id="item_' + randomId + '">' +
			'<input type="text" class="amount" placeholder="Amount" name="amount_' + randomId + '" data-id="' + randomId + ' style="width: 100px;">' +
			'<label style="padding-left: 5px; padding-right: 5px;"><input type="checkbox" value="amount_is_including_vat" name="ink_mva_' + randomId + '" checked="checked" class="inc_vat">Ink MVA</label>' +
			'<label style="padding-left: 5px; padding-right: 5px;"><input type="radio" value="0.25" name="vat_' + randomId + '" class="vat"> 25% VAT</label>' +
			'<label style="padding-left: 5px; padding-right: 5px;"><input type="radio" value="0.15" name="vat_' + randomId + '" class="vat"> 15% VAT</label>' +
			'<label style="padding-left: 5px; padding-right: 5px;"><input type="radio" value="0.10" name="vat_' + randomId + '" class="vat"> 10% VAT</label>' +
			'<label style="padding-left: 5px; padding-right: 5px;"><input type="radio" value="0" name="vat_' + randomId + '" class="vat"> 0% VAT</label>' +
			'<input type="text" placeholder="Post" name="accounting_post_' + randomId + '" class="accounting_post_split_input" style="width: 100px;">' +
			'<input type="text" placeholder="Subject" name="accounting_subject_' + randomId + '" class="accounting_subject_split_input" style="width: 100px;">' +
			'<input type="text" placeholder="Comment" name="comment_' + randomId + '" class="comment_split_input" style="width: 400px;">' +
			'<span style="padding-left: 15px;">' +
			'Eks MVA.: <span style="padding-right: 15px; font-weight: bold;" class="amount_ex_vat"></span>' +
			'MVA.:     <span style="padding-right: 15px; font-weight: bold;" class="amount_vat"></span>' +
			'Ink MVA.: <span style="padding-right: 15px; font-weight: bold;" class="amount_inc_vat"></span>' +
			'</span>' +
			'</div>'
		);
		var item = $('#item_' + randomId);
		var onChangeItem = function() {
			var amount = parseFloat($('.amount', item).val().replace('.', '').replace(/\s/g, '').replace(',', '.'));
			var incVat = $('.inc_vat', item).prop('checked');
			var currentVat = parseFloat($('.vat:checked', item).val() || 0);

			var amount_ex_vat;
			var amount_vat;
			var amount_inc_vat;			
			if (incVat) {
				amount_inc_vat = amount;
				amount_ex_vat = amount / (1 + currentVat);
			}
			else {
				amount_ex_vat = amount;
				amount_inc_vat = amount * (1 + currentVat);
			}
			amount_ex_vat = (new Number(parseInt(amount_ex_vat * 100) / 100));
			amount_inc_vat = (new Number(parseInt(amount_inc_vat * 100) / 100));
			amount_vat = amount_inc_vat - amount_ex_vat;
			console.log(amount, incVat, currentVat);
			console.log(amount_ex_vat, amount_vat, amount_inc_vat);
			$('.amount_ex_vat ', item).text(amount_ex_vat.toLocaleString('nb-NO'));
			$('.amount_vat    ', item).text((new Number(parseInt(amount_vat * 100) / 100)).toLocaleString('nb-NO'));
			$('.amount_inc_vat', item).text(amount_inc_vat.toLocaleString('nb-NO'));

			var total_amount_ex_vat = 0;
			var total_amount_vat = 0;
			var total_amount_inc_vat = 0;
			$('.amount_ex_vat').each(function() {
				total_amount_ex_vat += parseFloat($(this).text().replace(',', '.').replace(/\s/g, ''));
			});
			$('.amount_vat').each(function() {
				total_amount_vat += parseFloat($(this).text().replace(',', '.').replace(/\s/g, ''));
			});
			$('.amount_inc_vat').each(function() {
				total_amount_inc_vat += parseFloat($(this).text().replace(',', '.').replace(/\s/g, ''));
			});
			$('#accounting_post_split_ex_vat ').text(total_amount_ex_vat.toLocaleString('nb-NO'));
			$('#accounting_post_split_vat    ').text(total_amount_vat.toLocaleString('nb-NO'));
			$('#accounting_post_split_inc_vat').text(total_amount_inc_vat.toLocaleString('nb-NO'));
			
			if (new Number(selected_amount.replace(',', '.').replace(/\s/g, '')).toLocaleString('nb-NO') == total_amount_inc_vat.toLocaleString('nb-NO')) {
				$('#accounting_post_split_inc_vat').css('color', 'green');
			}
			else {
				$('#accounting_post_split_inc_vat').css('color', 'red');
			}
		}
		var itemInputs = $('input', item);
		itemInputs.change(onChangeItem);
		itemInputs.keypress(onChangeItem);
		itemInputs.keyup(onChangeItem);
	}
	// 9 - Comment
	function onclickAccountingPost() {
		selected_accounting_post = $(this).data('post');
		updateHtml(htmlComment());
	}
	function onclickAccountingPostSplitNext() {
		var items = [];
		$('.split-items').each(function() {
			items.push({
				'amount': $('.amount', this).val(),
				'amount_includes_vat': $('.inc_vat', this).prop('checked'),
				'vat_rate': $('.vat:checked', this).val(),
				'accounting_post': $('.accounting_post_split_input', this).val(),
				'accounting_subject': $('.accounting_subject_split_input', this).val(),
				'comment': $('.comment_split_input', this).val()
			});
		});
		selected_split_items = items;
		updateHtml(htmlComment());
	}
	function onchangeComment() {
		comment = $(this).val();
		$('#status-wrapper').html(htmlStatusInner());
	}
	// 10 - Submit form
	function onclickCommentNext() {
		comment = $('#comment_input').val();
		updateHtml(htmlFormSubmit());
	}
});
