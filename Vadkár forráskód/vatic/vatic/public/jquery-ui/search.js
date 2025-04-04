(function(document) {
	'use strict';

	var LightTableFilter= (function(Arr) {

		var _input="";

		function _onInputEvent(e) {
			_input = e.target;
			var tables = document.getElementsByClassName(_input.getAttribute('data-table'));
			Arr.forEach.call(tables, function(table) {
				Arr.forEach.call(table.tBodies, function(tbody) {
					Arr.forEach.call(tbody.rows, _filter);
				});
			});
		}

		function _onInputEvent2(e) {
			_input = e.target;
			var tables = document.getElementsByClassName(_input.getAttribute('data-table'));
			Arr.forEach.call(tables, function(table) {
				Arr.forEach.call(table.tBodies, function(tbody) {
					Arr.forEach.call(tbody.rows, _filter2);
				});
			});
		}


		function _filter(row) {
			var text = row.cells[0].textContent.toLowerCase(), val = _input.value.toLowerCase();
			var input2=document.getElementsByClassName("light-table-filter-obj")[0];
			var text2 = row.cells[5].textContent.toLowerCase(), val2 = input2.value.toLowerCase();
			row.style.display = (text.indexOf(val) === -1 || text2.indexOf(val2) === -1)? 'none' : 'table-row';
		}

		function _filter2(row) {
			var text = row.cells[5].textContent.toLowerCase(), val = _input.value.toLowerCase();
			var input2=document.getElementsByClassName("light-table-filter-name")[0];
			var text2 = row.cells[0].textContent.toLowerCase(), val2 = input2.value.toLowerCase();
			row.style.display = (text.indexOf(val) === -1 || text2.indexOf(val2) === -1)? 'none' : 'table-row';

		}


		return {
			init: function() {
				var inputs = document.getElementsByClassName('light-table-filter-name');
				Arr.forEach.call(inputs, function(input) {
					input.oninput = _onInputEvent;
				});
				var inputs = document.getElementsByClassName('light-table-filter-obj');
				Arr.forEach.call(inputs, function(input) {
					input.oninput = _onInputEvent2;
				});

			}
		};
	})(Array.prototype);

	document.addEventListener('readystatechange', function() {
		if (document.readyState === 'complete') {
			LightTableFilter.init();
		}
	});

})(document);